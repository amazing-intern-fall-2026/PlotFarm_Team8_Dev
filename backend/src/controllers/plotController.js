import { successResponse } from '../utils/response.js';
import * as plotService from '../services/plotService.js';

export const getAllPlots = async (req, res, next) => {
    try {
        const filters = {
            farmId: req.query.farmId || req.query.MaNongTrai,
            trangThai: req.query.trangThai || req.query.TrangThai
        };
        const data = await plotService.getPlots(filters, req.user);
        successResponse(res, { data });
    } catch (err) { next(err); }
};

export const getPlotById = async (req, res, next) => {
    try {
        const data = await plotService.getPlotById(req.params.id, req.user);
        successResponse(res, { data });
    } catch (err) { next(err); }
};

export const createPlot = async (req, res, next) => {
    try {
        const data = await plotService.createPlot(req.body, req.user);
        successResponse(res, { data, statusCode: 201, message: 'Tạo ô đất thành công' });
    } catch (err) { next(err); }
};

export const updatePlot = async (req, res, next) => {
    try {
        const data = await plotService.updatePlot(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật ô đất thành công' });
    } catch (err) { next(err); }
};

export const updateSensor = async (req, res, next) => {
    try {
        const data = await plotService.updateSensor(req.params.id, req.body, req.user);
        successResponse(res, { data, message: 'Cập nhật cảm biến thành công' });
    } catch (err) { next(err); }
};

export const deletePlot = async (req, res, next) => {
    try {
        await plotService.deletePlot(req.params.id, req.user);
        successResponse(res, { message: 'Xóa ô đất thành công' });
    } catch (err) { next(err); }
};

