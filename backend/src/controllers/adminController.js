import { successResponse } from '../utils/response.js';
import * as adminService from '../services/adminService.js';
import * as farmerAppService from '../services/farmerApplicationService.js';

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

// GET /api/v1/admin/farmer-applications
export const getFarmerApplications = async (req, res, next) => {
    try {
        const { status } = req.query;
        const data = await farmerAppService.getApplications(status);
        successResponse(res, { data, message: 'Lấy danh sách hồ sơ nông dân thành công' });
    } catch (err) { next(err); }
};

// GET /api/v1/admin/farmer-applications/:id
export const getFarmerApplicationById = async (req, res, next) => {
    try {
        const data = await farmerAppService.getApplicationById(req.params.id);
        successResponse(res, { data, message: 'Lấy chi tiết hồ sơ nông dân thành công' });
    } catch (err) { next(err); }
};

// POST /api/v1/admin/farmer-applications/:id/approve
export const approveFarmerApplication = async (req, res, next) => {
    try {
        const data = await farmerAppService.approveApplication(req.params.id, req.user?.accountId || 'admin');
        successResponse(res, { data, message: 'Duyệt hồ sơ và kích hoạt tài khoản Nông Dân thành công' });
    } catch (err) { next(err); }
};

// POST /api/v1/admin/farmer-applications/:id/reject
export const rejectFarmerApplication = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const data = await farmerAppService.rejectApplication(req.params.id, reason, req.user?.accountId || 'admin');
        successResponse(res, { data, message: 'Từ chối hồ sơ nông dân thành công' });
    } catch (err) { next(err); }
};
