import { successResponse } from '../utils/response.js';
import * as paymentService from '../services/paymentService.js';

// POST /payments/initiate — CUSTOMER: tao giao dich + hop dong PENDING
export const initiatePayment = async (req, res, next) => {
    try {
        const data = await paymentService.initiatePayment(req.body, req.user);
        successResponse(res, {
            statusCode: 201,
            data,
            message: 'Tao giao dich thanh toan thanh cong. Vui long chuyen khoan va xac nhan.',
        });
    } catch (err) { next(err); }
};

// POST /payments/:id/confirm — CUSTOMER: xac nhan da thanh toan
export const confirmPayment = async (req, res, next) => {
    try {
        const data = await paymentService.confirmPayment(req.params.id, req.user);
        successResponse(res, {
            data,
            message: 'Xac nhan thanh toan thanh cong. Hop dong da duoc kich hoat!',
        });
    } catch (err) { next(err); }
};

// GET /payments/my — CUSTOMER: xem lich su giao dich cua minh
export const getMyPayments = async (req, res, next) => {
    try {
        const data = await paymentService.getMyPayments(req.user);
        successResponse(res, { data, message: 'Lay danh sach giao dich thanh cong' });
    } catch (err) { next(err); }
};

// GET /payments/:id — CUSTOMER/ADMIN
export const getPaymentById = async (req, res, next) => {
    try {
        const data = await paymentService.getPaymentById(req.params.id, req.user);
        successResponse(res, { data, message: 'Lay chi tiet giao dich thanh cong' });
    } catch (err) { next(err); }
};

// GET /payments — ADMIN: xem tat ca
export const getAllPayments = async (req, res, next) => {
    try {
        const data = await paymentService.getAllPayments(req.user, req.query);
        successResponse(res, { data, message: 'Lay danh sach giao dich thanh cong' });
    } catch (err) { next(err); }
};
