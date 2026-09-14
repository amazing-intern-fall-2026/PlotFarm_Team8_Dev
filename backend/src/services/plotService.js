import * as plotRepo from '../repositories/plotRepository.js';
import * as farmRepo from '../repositories/farmRepository.js';
import { AppError } from '../utils/AppError.js';

export const getPlots = async (filters = {}, user) => {
    if (user?.role === 'FARMER') {
        filters.farmerId = user.userId;
    }
    return await plotRepo.getAllPlots(filters);
};


export const getPlotById = async (id, user) => {
    const plot = await plotRepo.getPlotById(id);
    if (!plot) {
        throw new AppError('Không tìm thấy ô đất', 404);
    }
    return plot;
};

export const createPlot = async (body, user) => {
    const farmId = body.MaNongTrai || body.farmId;
    const tenODat = body.TenODat || body.tenODat;
    const dienTich = body.DienTich !== undefined ? body.DienTich : body.dienTich;
    const giaThue = body.GiaThue !== undefined ? body.GiaThue : body.giaThue;

    if (!farmId || !tenODat || dienTich === undefined || giaThue === undefined) {
        throw new AppError('Thiếu dữ liệu bắt buộc (MaNongTrai, TenODat, DienTich, GiaThue)', 400);
    }

    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền tạo ô đất.', 403);
    }

    const farm = await farmRepo.getFarmById(farmId);
    if (!farm) {
        throw new AppError('Không tìm thấy nông trại', 404);
    }

    if (user.role === 'FARMER' && farm.MaChuNongTrai !== user.userId) {
        throw new AppError('Bạn không có quyền quản lý ô đất trên nông trại này.', 403);
    }

    const data = {
        MaNongTrai: farmId,
        TenODat: tenODat,
        DienTich: dienTich,
        GiaThue: giaThue,
        TrangThai: body.TrangThai || body.trangThai || 'TRONG',
        CameraUrl: body.CameraUrl !== undefined ? body.CameraUrl : (body.cameraUrl ?? null),
        HinhAnhThumbnail: body.HinhAnhThumbnail !== undefined ? body.HinhAnhThumbnail : (body.hinhAnhThumbnail ?? null)
    };

    return await plotRepo.createPlot(data);
};

export const updatePlot = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền sửa ô đất.', 403);
    }

    const plot = await plotRepo.getPlotById(id);
    if (!plot) {
        throw new AppError('Không tìm thấy ô đất', 404);
    }

    if (user.role === 'FARMER' && plot.MaChuNongTrai !== user.userId) {
        throw new AppError('Bạn không có quyền sửa ô đất này.', 403);
    }

    const updateData = {};
    if (body.TenODat !== undefined) updateData.TenODat = body.TenODat;
    else if (body.tenODat !== undefined) updateData.TenODat = body.tenODat;

    if (body.DienTich !== undefined) updateData.DienTich = body.DienTich;
    else if (body.dienTich !== undefined) updateData.DienTich = body.dienTich;

    if (body.TrangThai !== undefined) updateData.TrangThai = body.TrangThai;
    else if (body.trangThai !== undefined) updateData.TrangThai = body.trangThai;

    if (body.GiaThue !== undefined) updateData.GiaThue = body.GiaThue;
    else if (body.giaThue !== undefined) updateData.GiaThue = body.giaThue;

    if (body.CameraUrl !== undefined) updateData.CameraUrl = body.CameraUrl;
    else if (body.cameraUrl !== undefined) updateData.CameraUrl = body.cameraUrl;

    if (body.HinhAnhThumbnail !== undefined) updateData.HinhAnhThumbnail = body.HinhAnhThumbnail;
    else if (body.hinhAnhThumbnail !== undefined) updateData.HinhAnhThumbnail = body.hinhAnhThumbnail;

    return await plotRepo.updatePlot(id, updateData);
};

export const updateSensor = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền cập nhật cảm biến cho ô đất này.', 403);
    }

    const plot = await plotRepo.getPlotById(id);
    if (!plot) {
        throw new AppError('Không tìm thấy ô đất', 404);
    }

    if (user.role === 'FARMER' && plot.MaChuNongTrai !== user.userId) {
        throw new AppError('Bạn không có quyền cập nhật cảm biến cho ô đất này.', 403);
    }

    const sensorData = {};
    if (body.DoAmDat !== undefined) sensorData.DoAmDat = body.DoAmDat;
    else if (body.doAmDat !== undefined) sensorData.DoAmDat = body.doAmDat;

    if (body.NhietDo !== undefined) sensorData.NhietDo = body.NhietDo;
    else if (body.nhietDo !== undefined) sensorData.NhietDo = body.nhietDo;

    if (body.DoPH !== undefined) sensorData.DoPH = body.DoPH;
    else if (body.doPH !== undefined) sensorData.DoPH = body.doPH;

    if (body.AnhSangLux !== undefined) sensorData.AnhSangLux = body.AnhSangLux;
    else if (body.anhSangLux !== undefined) sensorData.AnhSangLux = body.anhSangLux;

    return await plotRepo.updatePlotSensor(id, sensorData);
};

export const deletePlot = async (id, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xóa ô đất.', 403);
    }

    const plot = await plotRepo.getPlotById(id);
    if (!plot) {
        throw new AppError('Không tìm thấy ô đất', 404);
    }

    if (user.role === 'FARMER' && plot.MaChuNongTrai !== user.userId) {
        throw new AppError('Bạn không có quyền xóa ô đất này.', 403);
    }

    return await plotRepo.deletePlot(id);
};

