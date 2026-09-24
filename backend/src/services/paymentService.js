import * as paymentRepository from '../repositories/paymentRepository.js';
import * as contractRepository from '../repositories/contractRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { AppError } from '../utils/AppError.js';

// CUSTOMER: Tạo giao dịch thanh toán + hợp đồng PENDING
export const initiatePayment = async (payload, user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chi Khach hang moi co the tao giao dich thanh toan.', 403);
    }

    const maODat     = payload.maODat     || payload.MaODat;
    const maCayTrong = payload.maCayTrong || payload.MaCayTrong;
    const soThangThueRaw = payload.soThangThue !== undefined ? payload.soThangThue : payload.SoThangThue;
    const soThangThue = Number(soThangThueRaw);
    const phuongThuc  = payload.phuongThuc || payload.PhuongThuc || 'VIETQR';

    if (!maODat || !maCayTrong || !soThangThueRaw || isNaN(soThangThue) || soThangThue <= 0) {
        throw new AppError('Du lieu khong hop le. Vui long cung cap ma o dat, ma cay trong va so thang thue.', 400);
    }

    const validMethods = ['VIETQR', 'VNPAY', 'MOMO'];
    if (!validMethods.includes(phuongThuc)) {
        throw new AppError(`Phuong thuc thanh toan khong hop le. Phai la: ${validMethods.join(', ')}.`, 400);
    }

    return runInTransaction(async (transaction) => {
        // 1. Kiem tra o dat con trong (voi row lock)
        const plot = await contractRepository.checkPlotAvailability(maODat, transaction);
        if (!plot) throw new AppError('Khong tim thay O Dat.', 404);
        if (plot.TrangThai !== 'TRONG') throw new AppError('O Dat nay hien khong trong.', 400);

        // 2. Kiem tra cay trong
        const crop = await contractRepository.checkCropExists(maCayTrong, transaction);
        if (!crop) throw new AppError('Khong tim thay Cay trong.', 404);

        // 3. Tinh toan
        const ngayBatDau   = new Date();
        const ngayKetThuc  = new Date();
        ngayKetThuc.setMonth(ngayKetThuc.getMonth() + soThangThue);
        const tongTien     = Number(plot.GiaThue) * soThangThue;
        const noiDungCK    = `PF THUE ${maODat} ${user.userId}`;

        // 4. Tao hop dong PENDING (chua kich hoat o dat)
        const contractData = {
            MaKH:       user.userId,
            MaODat:     maODat,
            MaCayTrong: maCayTrong,
            NgayBatDau: ngayBatDau,
            NgayKetThuc: ngayKetThuc,
            TongTien:   tongTien,
            TrangThai:  'PENDING',
        };
        const newContract = await contractRepository.createContract(contractData, transaction);

        // 5. Tao giao dich thanh toan PENDING
        const paymentData = {
            MaHopDong:  newContract.MaHopDong,
            MaKH:       user.userId,
            SoTien:     tongTien,
            PhuongThuc: phuongThuc,
            NoiDungCK:  noiDungCK,
        };
        const newPayment = await paymentRepository.createPayment(paymentData, transaction);

        return {
            payment: newPayment,
            contract: newContract,
            bankInfo: {
                nganHang:      'TMCP Ngoai Thuong Viet Nam (Vietcombank)',
                soTaiKhoan:    '0071000998877',
                chuTaiKhoan:   'CONG TY CP NONG NGHIEP SO PLOTFARM',
                soTien:        tongTien,
                noiDungCK:     noiDungCK,
            },
        };
    });
};

// CUSTOMER: Xac nhan da chuyen khoan -> kich hoat hop dong
export const confirmPayment = async (paymentId, user) => {
    if (!['CUSTOMER', 'ADMIN'].includes(user?.role)) {
        throw new AppError('Ban khong co quyen xac nhan giao dich nay.', 403);
    }

    return runInTransaction(async (transaction) => {
        // 1. Lay payment (khong dung BASE_SELECT JOIN de tranh lock)
        const payment = await paymentRepository.getPaymentById(paymentId);
        if (!payment) throw new AppError('Khong tim thay giao dich thanh toan.', 404);
        if (payment.TrangThai !== 'PENDING') {
            throw new AppError(`Giao dich nay da o trang thai "${payment.TrangThai}", khong the xac nhan.`, 400);
        }

        // 2. Kiem tra quyen: CUSTOMER chi xac nhan cua chinh minh
        if (user.role === 'CUSTOMER' && payment.MaKH !== user.userId) {
            throw new AppError('Ban khong co quyen xac nhan giao dich nay.', 403);
        }

        // 3. Kiem tra o dat van con trong (tranh race condition)
        const plot = await contractRepository.checkPlotAvailability(payment.MaODat, transaction);
        if (!plot) throw new AppError('Khong tim thay O Dat.', 404);
        if (plot.TrangThai !== 'TRONG') {
            // Huy giao dich vi o dat da co nguoi khac dat truoc
            await paymentRepository.updatePaymentStatus(paymentId, 'FAILED', null, transaction);
            throw new AppError('O Dat nay da co nguoi khac dat thue truoc. Giao dich cua ban bi huy.', 409);
        }

        // 4. Cap nhat payment -> COMPLETED
        const updatedPayment = await paymentRepository.updatePaymentStatus(
            paymentId, 'COMPLETED', `SIM-${Date.now()}`, transaction
        );

        // 5. Kich hoat hop dong -> ACTIVE
        await contractRepository.activateContract(payment.MaHopDong, transaction);

        // 6. Cap nhat o dat -> DANG_THUE
        await contractRepository.updatePlotStatus(payment.MaODat, 'DANG_THUE', transaction);

        // KHONG goi getContractById o day - se deadlock vi HOPDONGTHUE dang bi lock boi transaction nay
        // Tra ve du lieu tu payment da co san
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
};

// CUSTOMER: Xem danh sach giao dich cua minh
export const getMyPayments = async (user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chi Khach hang moi co the xem giao dich cua minh.', 403);
    }
    return paymentRepository.getPaymentsByCustomerId(user.userId);
};

// CUSTOMER/ADMIN: Xem chi tiet 1 giao dich
export const getPaymentById = async (id, user) => {
    const payment = await paymentRepository.getPaymentById(id);
    if (!payment) throw new AppError('Khong tim thay giao dich thanh toan.', 404);
    if (user?.role === 'CUSTOMER' && payment.MaKH !== user.userId) {
        throw new AppError('Ban khong co quyen xem giao dich nay.', 403);
    }
    return payment;
};

// ADMIN: Xem tat ca giao dich
export const getAllPayments = async (user, query = {}) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chi Admin moi co the xem tat ca giao dich.', 403);
    }
    const filters = {};
    if (query.trangThai) filters.trangThai = query.trangThai;
    if (query.phuongThuc) filters.phuongThuc = query.phuongThuc;
    return paymentRepository.getAllPayments(filters);
};
