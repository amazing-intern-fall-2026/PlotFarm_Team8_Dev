import { successResponse } from '../utils/response.js';
import * as careRequestService from '../services/careRequestService.js';

// POST /api/v1/care-requests
export const createCareRequest = async (req, res, next) => {
    try {
        const data = await careRequestService.createCareRequest(req.body, req.user);
        successResponse(res, { statusCode: 201, data, message: 'Gửi yêu cầu chăm sóc thành công' });
    } catch (err) { next(err); }
};

// GET /api/v1/care-requests/my
export const getMyCareRequests = async (req, res, next) => {
    try {
        const data = await careRequestService.getMyCareRequests(req.user);
        successResponse(res, { data, message: 'Lấy danh sách yêu cầu chăm sóc của bạn thành công' });
    } catch (err) { next(err); }
};

// GET /api/v1/care-requests
export const getAllCareRequests = async (req, res, next) => {
    try {
        const data = await careRequestService.getAllCareRequests(req.user, req.query);
        successResponse(res, { data, message: 'Lấy danh sách yêu cầu chăm sóc thành công' });
    } catch (err) { next(err); }
};

// PATCH /api/v1/care-requests/:id/status
export const updateCareRequestStatus = async (req, res, next) => {
    try {
        const data = await careRequestService.updateCareRequestStatus(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật trạng thái yêu cầu chăm sóc thành công' });
    } catch (err) { next(err); }
};
