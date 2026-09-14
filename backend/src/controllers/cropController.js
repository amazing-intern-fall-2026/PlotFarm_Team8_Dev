import { successResponse } from '../utils/response.js';
import * as cropService from '../services/cropService.js';

export const getAllCrops = async (req, res, next) => {
  try {
    const data = await cropService.getAllCrops();
    successResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getCropById = async (req, res, next) => {
  try {
    const data = await cropService.getCropById(req.params.id);
    successResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

export const createCrop = async (req, res, next) => {
  try {
    const data = await cropService.createCrop(req.body, req.user);
    successResponse(res, { statusCode: 201, data, message: 'Thêm cây trồng thành công' });
  } catch (err) {
    next(err);
  }
};
