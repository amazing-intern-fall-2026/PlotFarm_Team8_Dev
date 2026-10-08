import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// ─── 1. WEBHOOK & IPN ENDPOINTS (PUBLIC: GỌI TỪ SERVER CỔNG THANH TOÁN) ──────
// VietQR (SePay / Casso / biến động số dư ngân hàng)
router.post('/vietqr-webhook', paymentController.handleVietQrWebhook);

// VNPay IPN (Server-to-Server callback, hỗ trợ cả GET & POST)
router.all('/vnpay-ipn', paymentController.handleVNPayIpn);

// VNPay Return URL (Trình duyệt người dùng redirect về sau khi thanh toán)
router.get('/vnpay-return', paymentController.handleVNPayReturn);

// MoMo IPN (Server-to-Server callback)
router.post('/momo-ipn', paymentController.handleMoMoIpn);

// MoMo Return URL (Trình duyệt người dùng redirect về sau khi thanh toán)
router.get('/momo-return', paymentController.handleMoMoReturn);

// Generic Webhook (Tương thích ngược)
router.post('/webhook', paymentController.handleWebhook);


// ─── 2. CLIENT AUTHENTICATED ENDPOINTS ───────────────────────────────────────
// POST /payments/initiate — CUSTOMER: Tạo giao dịch thanh toán đa cổng (VIETQR, VNPAY, MOMO)
router.post('/initiate', authenticate, authorize('CUSTOMER'), paymentController.initiatePayment);

// POST /payments/:id/confirm — CUSTOMER/ADMIN: Xác nhận đã thanh toán thủ công (Fallback)
router.post('/:id/confirm', authenticate, authorize('CUSTOMER', 'ADMIN'), paymentController.confirmPayment);

// POST /payments/:id/cancel — CUSTOMER/ADMIN: Hủy giao dịch PENDING
router.post('/:id/cancel', authenticate, authorize('CUSTOMER', 'ADMIN'), paymentController.cancelPayment);

// GET /payments/my — CUSTOMER: Lịch sử giao dịch của mình (/my phải trước /:id)
router.get('/my', authenticate, authorize('CUSTOMER'), paymentController.getMyPayments);

// GET /payments — ADMIN: Xem tất cả giao dịch
router.get('/', authenticate, authorize('ADMIN'), paymentController.getAllPayments);

// GET /payments/:id — CUSTOMER/ADMIN: Chi tiết 1 giao dịch
router.get('/:id', authenticate, paymentController.getPaymentById);

export default router;
