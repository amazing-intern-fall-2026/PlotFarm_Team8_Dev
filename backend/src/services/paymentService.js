import crypto from 'crypto';
import * as paymentRepository from '../repositories/paymentRepository.js';
import * as contractRepository from '../repositories/contractRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { AppError } from '../utils/AppError.js';
import { getPaymentStrategy } from './payments/paymentStrategyFactory.js';
import * as vietqrService from './payments/vietqrService.js';
import * as vnpayService from './payments/vnpayService.js';
import * as momoService from './payments/momoService.js';

// CUSTOMER: Tạo giao dịch thanh toán + hợp đồng PENDING (Đa cổng: VIETQR, VNPAY, MOMO)
export const initiatePayment = async (payload, user, req = null) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chi Khach hang moi co the tao giao dich thanh toan.', 403);
    }

    const maODat     = payload.maODat     || payload.MaODat;
    const maCayTrong = payload.maCayTrong || payload.MaCayTrong;
    const soThangThueRaw = payload.soThangThue !== undefined ? payload.soThangThue : payload.SoThangThue;
    const soThangThue = Number(soThangThueRaw);
    const phuongThuc  = String(payload.phuongThuc || payload.PhuongThuc || 'VIETQR').toUpperCase();

    if (!maODat || !maCayTrong || !soThangThueRaw || isNaN(soThangThue) || soThangThue <= 0) {
        throw new AppError('Du lieu khong hop le. Vui long cung cap ma o dat, ma cay trong va so thang thue.', 400);
    }

    const validMethods = ['VIETQR', 'VNPAY', 'MOMO'];
    if (!validMethods.includes(phuongThuc)) {
        throw new AppError(`Phuong thuc thanh toan khong hop le. Phai la: ${validMethods.join(', ')}.`, 400);
    }

    // 1. Tạo hợp đồng & thanh toán trong Transaction an toàn
    const { newPayment, newContract, plot } = await runInTransaction(async (transaction) => {
        // Kiểm tra ô đất còn trống (với row lock)
        const currentPlot = await contractRepository.checkPlotAvailability(maODat, transaction);
        if (!currentPlot) throw new AppError('Khong tim thay O Dat.', 404);
        if (currentPlot.TrangThai !== 'TRONG') throw new AppError('O Dat nay hien khong trong.', 400);

        // Kiểm tra cây trồng
        const crop = await contractRepository.checkCropExists(maCayTrong, transaction);
        if (!crop) throw new AppError('Khong tim thay Cay trong.', 404);

        // Tính toán thời hạn và số tiền
        const ngayBatDau   = new Date();
        const ngayKetThuc  = new Date();
        ngayKetThuc.setMonth(ngayKetThuc.getMonth() + soThangThue);
        const tongTien     = Number(currentPlot.GiaThue) * soThangThue;
        const noiDungCK    = `PF THUE ${maODat} ${user.userId}`;

        // Tạo hợp đồng PENDING
        const contractData = {
            MaKH:       user.userId,
            MaODat:     maODat,
            MaCayTrong: maCayTrong,
            NgayBatDau: ngayBatDau,
            NgayKetThuc: ngayKetThuc,
            TongTien:   tongTien,
            TrangThai:  'PENDING',
        };
        const createdContract = await contractRepository.createContract(contractData, transaction);

        // Tạo giao dịch thanh toán PENDING
        const paymentData = {
            MaHopDong:  createdContract.MaHopDong,
            MaKH:       user.userId,
            SoTien:     tongTien,
            PhuongThuc: phuongThuc,
            NoiDungCK:  noiDungCK,
        };
        const createdPayment = await paymentRepository.createPayment(paymentData, transaction);

        return { newPayment: createdPayment, newContract: createdContract, plot: currentPlot };
    });

    // 2. Gọi Strategy tương ứng để lấy thông tin thanh toán (QR code hoặc Checkout URL)
    const strategy = getPaymentStrategy(phuongThuc);
    const ipAddr = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    const gatewayResult = await strategy.createPayment({
        payment: newPayment,
        contract: newContract,
        user,
        plot,
        ipAddr,
    });

    return {
        payment: newPayment,
        contract: newContract,
        method: phuongThuc,
        ...gatewayResult,
    };
};

// CUSTOMER/ADMIN: Xác nhận đã chuyển khoản thủ công -> kích hoạt hợp đồng
export const confirmPayment = async (paymentId, user) => {
    if (!['CUSTOMER', 'ADMIN'].includes(user?.role)) {
        throw new AppError('Ban khong co quyen xac nhan giao dich nay.', 403);
    }

    const result = await runInTransaction(async (transaction) => {
        // Lay payment voi ROWLOCK de tranh race condition / duplicate submit
        const payment = await paymentRepository.getPaymentForUpdate(paymentId, transaction);
        if (!payment) throw new AppError('Khong tim thay giao dich thanh toan.', 404);

        // Idempotency check: Neu da COMPLETED tu truoc
        if (payment.TrangThai === 'COMPLETED') {
            return {
                payment,
                contract: {
                    MaHopDong:   payment.MaHopDong,
                    MaODat:      payment.MaODat,
                    TrangThai:   'ACTIVE',
                    TenNongTrai: payment.TenNongTrai,
                    MaNongTrai:  payment.MaNongTrai,
                },
                alreadyCompleted: true,
            };
        }

        if (payment.TrangThai !== 'PENDING') {
            throw new AppError(`Giao dich nay da o trang thai "${payment.TrangThai}", khong the xac nhan.`, 400);
        }

        // Kiem tra quyen
        if (user.role === 'CUSTOMER' && payment.MaKH !== user.userId) {
            throw new AppError('Ban khong co quyen xac nhan giao dich nay.', 403);
        }

        // Kiem tra o dat
        const plot = await contractRepository.checkPlotAvailability(payment.MaODat, transaction);
        if (!plot) throw new AppError('Khong tim thay O Dat.', 404);
        if (plot.TrangThai !== 'TRONG') {
            const failNote = 'O dat da co nguoi khac hoan tat thanh toan truoc do.';
            await paymentRepository.updatePaymentStatus(paymentId, 'FAILED', null, transaction, failNote);
            await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);

            return {
                isConflict: true,
                message: 'O Dat nay da co nguoi khac hoan tat dat thue truoc do. Giao dich cua ban da bi huy. Neu ban da chuyen khoan, vui long lien he hotline/email PlotFarm de duoc hoan tien ngay.',
            };
        }

        // Cap nhat COMPLETED
        const transactionRef = `SIM-${Date.now()}`;
        const updatedPayment = await paymentRepository.updatePaymentStatus(
            paymentId, 'COMPLETED', transactionRef, transaction, `Xac nhan boi ${user.userId} (${user.role})`
        );

        // Kich hoat hop dong -> ACTIVE
        await contractRepository.activateContract(payment.MaHopDong, transaction);

        // Cap nhat o dat -> DANG_THUE
        await contractRepository.updatePlotStatus(payment.MaODat, 'DANG_THUE', transaction);

        return {
            payment: updatedPayment,
            contract: {
                MaHopDong:   payment.MaHopDong,
                MaODat:      payment.MaODat,
                TrangThai:   'ACTIVE',
                TenNongTrai: payment.TenNongTrai,
                MaNongTrai:  payment.MaNongTrai,
            },
        };
    });

    if (result.isConflict) {
        throw new AppError(result.message, 409);
    }

    return result;
};

// CUSTOMER/ADMIN: Hủy giao dịch thanh toán PENDING
export const cancelPayment = async (paymentId, user, lyDo = null) => {
    if (!['CUSTOMER', 'ADMIN'].includes(user?.role)) {
        throw new AppError('Ban khong co quyen huy giao dich nay.', 403);
    }

    return runInTransaction(async (transaction) => {
        const payment = await paymentRepository.getPaymentForUpdate(paymentId, transaction);
        if (!payment) throw new AppError('Khong tim thay giao dich thanh toan.', 404);

        if (user.role === 'CUSTOMER' && payment.MaKH !== user.userId) {
            throw new AppError('Ban khong co quyen huy giao dich nay.', 403);
        }

        if (payment.TrangThai !== 'PENDING') {
            throw new AppError(`Giao dich dang o trang thai "${payment.TrangThai}", khong the huy.`, 400);
        }

        const note = lyDo || `Huy boi ${user.userId} (${user.role})`;
        const updatedPayment = await paymentRepository.updatePaymentStatus(
            paymentId, 'FAILED', null, transaction, note
        );

        await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);

        return {
            payment: updatedPayment,
            message: 'Da huy giao dich va hop dong thanh cong.',
        };
    });
};

// ─── 1. XỬ LÝ VIETQR WEBHOOK (SePay / Casso / Bank biến động số dư) ───────────
export const handleVietQrWebhook = async (payload, headers) => {
    const verified = vietqrService.verifyVietQrWebhook({ payload, headers });
    if (!verified.isValid) {
        throw new AppError(verified.reason || 'Chu ky hoac API key VietQR khong hop le.', 401);
    }

    const { paymentId, content, receivedAmount, transactionNo } = verified;

    return runInTransaction(async (transaction) => {
        let payment = null;
        if (paymentId) {
            payment = await paymentRepository.getPaymentForUpdate(paymentId, transaction);
        }
        if (!payment && content) {
            payment = await paymentRepository.getPaymentByContentOrOrder(content, transaction);
        }

        if (!payment) {
            throw new AppError('Khong tim thay giao dich phu hop voi noi dung chuyen khoan.', 404);
        }

        // Idempotency: Neu da thanh cong truoc do
        if (payment.TrangThai === 'COMPLETED') {
            return { success: true, alreadyProcessed: true, message: 'Giao dich da duoc xu ly truoc do.' };
        }

        // Kiem tra so tien
        if (receivedAmount > 0 && receivedAmount < Number(payment.SoTien)) {
            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'FAILED',
                transactionNo,
                transaction,
                `Thieu so tien: Nhan ${receivedAmount}, can ${payment.SoTien}`
            );
            throw new AppError(`So tien thanh toan khong du (Thuc nhan: ${receivedAmount}, Yeu cau: ${payment.SoTien}).`, 400);
        }

        // Kiem tra o dat
        const plot = await contractRepository.checkPlotAvailability(payment.MaODat, transaction);
        if (!plot || plot.TrangThai !== 'TRONG') {
            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'FAILED',
                transactionNo,
                transaction,
                'Overbooking: O dat da duoc thue truoc do'
            );
            await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);
            return { success: false, isConflict: true, message: 'O dat khong con trong. Can hoan tien.' };
        }

        // Kich hoat COMPLETED
        const updatedPayment = await paymentRepository.updatePaymentStatus(
            payment.MaThanhToan,
            'COMPLETED',
            transactionNo,
            transaction,
            'Xac nhan tu dong qua VietQR Webhook'
        );
        await contractRepository.activateContract(payment.MaHopDong, transaction);
        await contractRepository.updatePlotStatus(payment.MaODat, 'DANG_THUE', transaction);

        return { success: true, message: 'Xac nhan VietQR thanh cong.', payment: updatedPayment };
    });
};

// ─── 2. XỬ LÝ VNPAY IPN & RETURN ──────────────────────────────────────────────
export const handleVNPayIpn = async (queryOrBody) => {
    const verified = vnpayService.verifyVNPayIpn(queryOrBody);
    if (!verified.isValid) {
        return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const { txnRef, amount, responseCode, transactionNo } = verified;

    return runInTransaction(async (transaction) => {
        const payment = await paymentRepository.getPaymentForUpdate(txnRef, transaction);
        if (!payment) {
            return { RspCode: '01', Message: 'Order not found' };
        }

        if (payment.TrangThai === 'COMPLETED') {
            return { RspCode: '02', Message: 'Order already confirmed' };
        }

        if (Math.abs(Number(payment.SoTien) - amount) > 0.01) {
            return { RspCode: '04', Message: 'Invalid Amount' };
        }

        if (responseCode === '00') {
            // Thanh toán thành công tại VNPay
            const plot = await contractRepository.checkPlotAvailability(payment.MaODat, transaction);
            if (!plot || plot.TrangThai !== 'TRONG') {
                await paymentRepository.updatePaymentStatus(
                    payment.MaThanhToan,
                    'FAILED',
                    transactionNo,
                    transaction,
                    'Overbooking: O dat da co nguoi thue truoc do'
                );
                await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);
                return { RspCode: '02', Message: 'Plot no longer available, marked for refund' };
            }

            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'COMPLETED',
                transactionNo,
                transaction,
                'Xac nhan tu dong qua VNPay IPN'
            );
            await contractRepository.activateContract(payment.MaHopDong, transaction);
            await contractRepository.updatePlotStatus(payment.MaODat, 'DANG_THUE', transaction);

            return { RspCode: '00', Message: 'Confirm Success' };
        } else {
            // Thanh toán thất bại hoặc người dùng hủy
            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'FAILED',
                transactionNo,
                transaction,
                `VNPay error code: ${responseCode}`
            );
            await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);
            return { RspCode: '00', Message: 'Transaction marked failed' };
        }
    });
};

// VNPay Return URL: Chỉ xác thực chữ ký để trả thông tin hiển thị UI (KHÔNG cập nhật DB)
export const handleVNPayReturn = (query) => {
    const verified = vnpayService.verifyVNPayIpn(query);
    return {
        isValid: verified.isValid,
        isSuccess: verified.isValid && verified.responseCode === '00',
        txnRef: verified.txnRef,
        amount: verified.amount,
        responseCode: verified.responseCode,
    };
};

// ─── 3. XỬ LÝ MOMO IPN & RETURN ───────────────────────────────────────────────
export const handleMoMoIpn = async (body) => {
    const verified = momoService.verifyMoMoIpn(body);
    if (!verified.isValid) {
        return { resultCode: 99, message: 'Invalid Signature' };
    }

    const { orderId, amount, resultCode, transactionNo } = verified;

    return runInTransaction(async (transaction) => {
        const payment = await paymentRepository.getPaymentForUpdate(orderId, transaction);
        if (!payment) {
            return { resultCode: 1, message: 'Order not found' };
        }

        if (payment.TrangThai === 'COMPLETED') {
            return { resultCode: 0, message: 'Order already confirmed' };
        }

        if (Math.abs(Number(payment.SoTien) - amount) > 0.01) {
            return { resultCode: 4, message: 'Invalid Amount' };
        }

        if (resultCode === 0) {
            // Thanh toán thành công tại MoMo
            const plot = await contractRepository.checkPlotAvailability(payment.MaODat, transaction);
            if (!plot || plot.TrangThai !== 'TRONG') {
                await paymentRepository.updatePaymentStatus(
                    payment.MaThanhToan,
                    'FAILED',
                    transactionNo,
                    transaction,
                    'Overbooking: O dat da duoc thue truoc do'
                );
                await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);
                return { resultCode: 0, message: 'Plot not available, marked for refund' };
            }

            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'COMPLETED',
                transactionNo,
                transaction,
                'Xac nhan tu dong qua MoMo IPN'
            );
            await contractRepository.activateContract(payment.MaHopDong, transaction);
            await contractRepository.updatePlotStatus(payment.MaODat, 'DANG_THUE', transaction);

            return { resultCode: 0, message: 'Successful' };
        } else {
            // Thanh toán thất bại hoặc người dùng hủy
            await paymentRepository.updatePaymentStatus(
                payment.MaThanhToan,
                'FAILED',
                transactionNo,
                transaction,
                `MoMo resultCode: ${resultCode}`
            );
            await contractRepository.updateContractStatus(payment.MaHopDong, 'CANCELLED', transaction);
            return { resultCode: 0, message: 'Transaction marked failed' };
        }
    });
};

// MoMo Return: Xác thực hiển thị UI (KHÔNG cập nhật DB)
export const handleMoMoReturn = (query) => {
    return {
        orderId: query.orderId,
        resultCode: Number(query.resultCode),
        isSuccess: Number(query.resultCode) === 0,
        amount: Number(query.amount),
    };
};

// ─── 4. UNIFIED WEBHOOK (Tương thích ngược với endpoint cũ /payments/webhook) ──
export const processWebhook = async (payload, signatureHeader) => {
    return handleVietQrWebhook(payload, { 'x-webhook-signature': signatureHeader });
};

// ─── 5. QUERY PAYMENTS ────────────────────────────────────────────────────────
export const getMyPayments = async (user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chi Khach hang moi co the xem giao dich cua minh.', 403);
    }
    return paymentRepository.getPaymentsByCustomerId(user.userId);
};

export const getPaymentById = async (id, user) => {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) throw new AppError('Khong tim thay giao dich thanh toan.', 404);
    if (user?.role === 'CUSTOMER' && payment.MaKH !== user.userId) {
        throw new AppError('Ban khong co quyen xem giao dich nay.', 403);
    }
    return payment;
};

export const getAllPayments = async (user, query = {}) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chi Admin moi co the xem tat ca giao dich.', 403);
    }
    const filters = {};
    if (query.trangThai) filters.trangThai = query.trangThai;
    if (query.phuongThuc) filters.phuongThuc = query.phuongThuc;
    return paymentRepository.getAllPayments(filters);
};
