import { successResponse } from '../utils/response.js';
import * as harvestService from '../services/harvestService.js';

// GET /api/v1/harvests/my
export const getMyHarvests = async (req, res, next) => {
    try {
        const data = await harvestService.getMyHarvests(req.user);
        successResponse(res, { data, message: 'Lấy danh sách thu hoạch của bạn thành công' });
    } catch (err) { next(err); }
};

// GET /api/v1/harvests
export const getAllHarvests = async (req, res, next) => {
    try {
        const data = await harvestService.getAllHarvests(req.user, req.query);
        successResponse(res, { data, message: 'Lấy danh sách thu hoạch thành công' });
    } catch (err) { next(err); }
};

// POST /api/v1/harvests
export const createHarvest = async (req, res, next) => {
    try {
        const data = await harvestService.createHarvest(req.body, req.user);
        successResponse(res, { statusCode: 201, data, message: 'Lên lịch thu hoạch thành công' });
    } catch (err) { next(err); }
};

// PATCH /api/v1/harvests/:id/status
export const updateHarvestStatus = async (req, res, next) => {
    try {
        const data = await harvestService.updateHarvestStatus(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật trạng thái thu hoạch thành công' });
    } catch (err) { next(err); }
};

// PATCH /api/v1/harvests/:id/delivery
export const updateHarvestDelivery = async (req, res, next) => {
    try {
        const data = await harvestService.updateHarvestDelivery(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật thông tin giao hàng thành công' });
    } catch (err) { next(err); }
};
