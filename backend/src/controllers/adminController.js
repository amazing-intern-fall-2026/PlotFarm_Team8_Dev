import { successResponse } from '../utils/response.js';
import * as adminService from '../services/adminService.js';

// GET /api/v1/admin/kpi
export const getKPI = async (req, res, next) => {
    try {
        const data = await adminService.getKPI(req.user);
        successResponse(res, { data, message: 'Lấy dữ liệu thống kê KPI thành công' });
    } catch (err) { next(err); }
};

// GET /api/v1/admin/users
export const getAllUsers = async (req, res, next) => {
    try {
        const data = await adminService.getAllUsers(req.user, req.query);
        successResponse(res, { data, message: 'Lấy danh sách người dùng thành công' });
    } catch (err) { next(err); }
};

// PATCH /api/v1/admin/users/:id/status
export const updateUserStatus = async (req, res, next) => {
    try {
        const data = await adminService.updateUserStatus(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật trạng thái người dùng thành công' });
    } catch (err) { next(err); }
};
