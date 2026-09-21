import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// POST /payments/initiate — CUSTOMER: tao giao dich + hop dong PENDING
router.post('/initiate', authenticate, authorize('CUSTOMER'), paymentController.initiatePayment);

// POST /payments/:id/confirm — CUSTOMER: xac nhan da chuyen khoan
router.post('/:id/confirm', authenticate, authorize('CUSTOMER'), paymentController.confirmPayment);

// GET /payments/my — CUSTOMER: lich su giao dich cua minh (/my phai truoc /:id)
router.get('/my', authenticate, authorize('CUSTOMER'), paymentController.getMyPayments);

// GET /payments — ADMIN: xem tat ca giao dich
router.get('/', authenticate, authorize('ADMIN'), paymentController.getAllPayments);

// GET /payments/:id — CUSTOMER/ADMIN: chi tiet 1 giao dich
router.get('/:id', authenticate, paymentController.getPaymentById);

export default router;
