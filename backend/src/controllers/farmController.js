import { successResponse } from '../utils/response.js';
import * as farmService from '../services/farmService.js';

export const getAllFarms = async (req, res, next) => {
  try {
    const farms = await farmService.getAllFarms(req.user);
    successResponse(res, { data: farms });
  } catch (err) { next(err); }
};

export const getMyFarms = async (req, res, next) => {
  try {
    const farms = await farmService.getMyFarms(req.user);
    successResponse(res, { data: farms });
  } catch (err) { next(err); }
};

export const getFarmById = async (req, res, next) => {
  try {
    const farm = await farmService.getFarmById(req.params.id);
    successResponse(res, { data: farm });
  } catch (err) { next(err); }
};

export const createFarm = async (req, res, next) => {
  try {
    const farm = await farmService.createFarm(req.body, req.user);
    successResponse(res, { statusCode: 201, data: farm, message: 'Tạo nông trại thành công' });
  } catch (err) { next(err); }
};

export const updateFarm = async (req, res, next) => {
  try {
    const farm = await farmService.updateFarm(req.params.id, req.body, req.user);
    successResponse(res, { data: farm, message: 'Cập nhật nông trại thành công' });
  } catch (err) { next(err); }
};

export const deleteFarm = async (req, res, next) => {
  try {
    await farmService.deleteFarm(req.params.id, req.user);
    successResponse(res, { message: 'Xóa nông trại thành công' });
  } catch (err) { next(err); }
};
