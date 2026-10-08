import { successResponse } from '../utils/response.js';
import * as paymentService from '../services/paymentService.js';
import { CLIENT_URL } from '../config/config.js';

// POST /payments/initiate — CUSTOMER: Tạo giao dịch thanh toán đa cổng
export const initiatePayment = async (req, res, next) => {
    try {
        const data = await paymentService.initiatePayment(req.body, req.user, req);
        successResponse(res, {
            statusCode: 201,
            data,
            message: 'Tạo giao dịch thanh toán thành công.',
        });
    } catch (err) { next(err); }
};

// POST /payments/:id/confirm — CUSTOMER/ADMIN: Xác nhận chuyển khoản thủ công (Dev/Testing/Admin)
export const confirmPayment = async (req, res, next) => {
    try {
        const data = await paymentService.confirmPayment(req.params.id, req.user);
        const msg = data?.alreadyCompleted
            ? 'Giao dịch đã được xác nhận trước đó.'
            : 'Xác nhận thanh toán thành công. Hợp đồng đã được kích hoạt!';
        successResponse(res, {
            data,
            message: msg,
        });
    } catch (err) { next(err); }
};

// POST /payments/:id/cancel — CUSTOMER/ADMIN: Hủy giao dịch PENDING
export const cancelPayment = async (req, res, next) => {
    try {
        const data = await paymentService.cancelPayment(req.params.id, req.user, req.body?.lyDo);
        successResponse(res, {
            data,
            message: 'Đã hủy giao dịch thanh toán thành công.',
        });
    } catch (err) { next(err); }
};

// ─── 1. VIETQR WEBHOOK ────────────────────────────────────────────────────────
// POST /payments/vietqr-webhook (SePay / Casso / Bank biến động số dư)
export const handleVietQrWebhook = async (req, res, next) => {
    try {
        const result = await paymentService.handleVietQrWebhook(req.body, req.headers);
        res.status(200).json(result);
    } catch (err) { next(err); }
};

// ─── 2. VNPAY IPN & RETURN ───────────────────────────────────────────────────
// ALL /payments/vnpay-ipn — Server-to-Server Webhook từ VNPay
export const handleVNPayIpn = async (req, res, next) => {
    try {
        const params = req.method === 'GET' ? req.query : req.body;
        const result = await paymentService.handleVNPayIpn(params);
        // VNPay bắt buộc nhận định dạng: { "RspCode": "00", "Message": "Confirm Success" }
        res.status(200).json(result);
    } catch (err) {
        res.status(200).json({ RspCode: '99', Message: err.message || 'Unknown error' });
    }
};

// GET /payments/vnpay-return — Trình duyệt khách hàng redirect về sau khi thanh toán tại VNPay
export const handleVNPayReturn = async (req, res) => {
    try {
        const result = paymentService.handleVNPayReturn(req.query);
        // Chuyển hướng về Frontend kèm kết quả hiển thị cho khách
        const redirectUrl = `${CLIENT_URL}/payment-return?method=VNPAY&isSuccess=${result.isSuccess}&txnRef=${result.txnRef || ''}&amount=${result.amount || 0}&code=${result.responseCode || ''}`;
        res.redirect(redirectUrl);
    } catch (err) {
        res.redirect(`${CLIENT_URL}/payment-return?method=VNPAY&isSuccess=false&error=${encodeURIComponent(err.message)}`);
    }
};

// ─── 3. MOMO IPN & RETURN ────────────────────────────────────────────────────
// POST /payments/momo-ipn — Server-to-Server Webhook từ MoMo
export const handleMoMoIpn = async (req, res) => {
    try {
        const result = await paymentService.handleMoMoIpn(req.body);
        // MoMo chuẩn: { resultCode: 0, message: "Successful" }
        res.status(200).json(result);
    } catch (err) {
        res.status(200).json({ resultCode: 99, message: err.message || 'Unknown error' });
    }
};

// GET /payments/momo-return — Trình duyệt khách hàng redirect về sau khi thanh toán tại MoMo
export const handleMoMoReturn = async (req, res) => {
    try {
        const result = paymentService.handleMoMoReturn(req.query);
        const redirectUrl = `${CLIENT_URL}/payment-return?method=MOMO&isSuccess=${result.isSuccess}&orderId=${result.orderId || ''}&amount=${result.amount || 0}&code=${result.resultCode || ''}`;
        res.redirect(redirectUrl);
    } catch (err) {
        res.redirect(`${CLIENT_URL}/payment-return?method=MOMO&isSuccess=false&error=${encodeURIComponent(err.message)}`);
    }
};

// POST /payments/webhook — Unified Webhook (tương thích ngược)
export const handleWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['x-webhook-signature'] || req.headers['x-signature'];
        const data = await paymentService.processWebhook(req.body, sig);
        successResponse(res, {
            data,
            message: data?.message || 'Xử lý webhook thành công.',
        });
    } catch (err) { next(err); }
};

// GET /payments/my — CUSTOMER: Xem lịch sử giao dịch của mình
export const getMyPayments = async (req, res, next) => {
    try {
        const data = await paymentService.getMyPayments(req.user);
        successResponse(res, { data, message: 'Lấy danh sách giao dịch thành công' });
    } catch (err) { next(err); }
};

// GET /payments/:id — Chi tiết giao dịch
export const getPaymentById = async (req, res, next) => {
    try {
        const data = await paymentService.getPaymentById(req.params.id, req.user);
        successResponse(res, { data, message: 'Lấy chi tiết giao dịch thành công' });
    } catch (err) { next(err); }
};

// GET /payments — ADMIN: Xem tất cả
export const getAllPayments = async (req, res, next) => {
    try {
        const data = await paymentService.getAllPayments(req.user, req.query);
        successResponse(res, { data, message: 'Lấy danh sách giao dịch thành công' });
    } catch (err) { next(err); }
};
