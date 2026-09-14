import { successResponse } from '../utils/response.js';
import * as farmingLogService from '../services/farmingLogService.js';

// GET /farming-logs?contractId=&plotId=
export const getLogs = async (req, res, next) => {
    try {
        const data = await farmingLogService.getLogs(req.query, req.user);
        successResponse(res, { data, message: 'Lấy danh sách nhật ký canh tác thành công' });
    } catch (err) { next(err); }
};

// POST /farming-logs
export const createLog = async (req, res, next) => {
    try {
        const data = await farmingLogService.createLog(req.body, req.user);
        successResponse(res, { statusCode: 201, data, message: 'Tạo nhật ký canh tác thành công' });
    } catch (err) { next(err); }
};

// PUT /farming-logs/:id
export const updateLog = async (req, res, next) => {
    try {
        const data = await farmingLogService.updateLog(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật nhật ký canh tác thành công' });
    } catch (err) { next(err); }
};

// DELETE /farming-logs/:id
export const deleteLog = async (req, res, next) => {
    try {
        await farmingLogService.deleteLog(req.params.id, req.user);
        successResponse(res, { message: 'Xóa nhật ký canh tác thành công' });
    } catch (err) { next(err); }
};
