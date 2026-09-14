import * as farmingLogRepository from '../repositories/farmingLogRepository.js';
import { AppError } from '../utils/AppError.js';

// All roles can view; CUSTOMER limited to logs from their own contracts
export const getLogs = async (query, user) => {
    const filters = {};

    const contractId = query.contractId || query.MaHopDong;
    const plotId = query.plotId || query.MaODat;

    if (contractId) filters.contractId = contractId;
    if (plotId)     filters.plotId     = plotId;

    // CUSTOMER: scope logs to their own contracts via MaKH join filter
    if (user?.role === 'CUSTOMER') {
        filters.maKH = user.userId;
    }

    return farmingLogRepository.getLogs(filters);
};

// ADMIN/FARMER only: create a new farming log
export const createLog = async (body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền tạo nhật ký canh tác.', 403);
    }

    const maHopDong = body.maHopDong || body.MaHopDong;
    const maODat = body.maODat || body.MaODat;
    const hoatDong = body.hoatDong || body.HoatDong;
    const giaiDoanCay = body.giaiDoanCay || body.GiaiDoanCay;
    const tienDoPhanTram = body.tienDoPhanTram !== undefined ? body.tienDoPhanTram : body.TienDoPhanTram;
    const moTa = body.moTa !== undefined ? body.moTa : body.MoTa;
    const hinhAnhMinhChung = body.hinhAnhMinhChung !== undefined ? body.hinhAnhMinhChung : body.HinhAnhMinhChung;

    // Required fields validation
    if (!maHopDong || !maODat || !hoatDong || !giaiDoanCay) {
        throw new AppError('MaHopDong, MaODat, HoatDong và GiaiDoanCay là bắt buộc.', 400);
    }

    // Progress percentage must be between 0 and 100
    if (tienDoPhanTram !== undefined && (tienDoPhanTram < 0 || tienDoPhanTram > 100)) {
        throw new AppError('TienDoPhanTram phải nằm trong khoảng 0 đến 100.', 400);
    }

    const data = {
        MaHopDong:        maHopDong,
        MaODat:           maODat,
        HoatDong:         hoatDong,
        GiaiDoanCay:      giaiDoanCay,
        TienDoPhanTram:   tienDoPhanTram ?? 0,
        MoTa:             moTa || null,
        HinhAnhMinhChung: hinhAnhMinhChung || null,
        NguoiGhi:         user.userId
    };

    return farmingLogRepository.createLog(data);
};

// ADMIN/FARMER only: update an existing log
export const updateLog = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền cập nhật nhật ký canh tác.', 403);
    }

    const existing = await farmingLogRepository.getLogById(id);
    if (!existing) {
        throw new AppError('Không tìm thấy nhật ký canh tác.', 404);
    }

    const tienDoPhanTram = body.tienDoPhanTram !== undefined ? body.tienDoPhanTram : body.TienDoPhanTram;
    if (tienDoPhanTram !== undefined && (tienDoPhanTram < 0 || tienDoPhanTram > 100)) {
        throw new AppError('TienDoPhanTram phải nằm trong khoảng 0 đến 100.', 400);
    }

    const updateData = {};
    if (body.hoatDong !== undefined || body.HoatDong !== undefined) {
        updateData.HoatDong = body.hoatDong !== undefined ? body.hoatDong : body.HoatDong;
    }
    if (body.giaiDoanCay !== undefined || body.GiaiDoanCay !== undefined) {
        updateData.GiaiDoanCay = body.giaiDoanCay !== undefined ? body.giaiDoanCay : body.GiaiDoanCay;
    }
    if (tienDoPhanTram !== undefined) {
        updateData.TienDoPhanTram = tienDoPhanTram;
    }
    if (body.moTa !== undefined || body.MoTa !== undefined) {
        updateData.MoTa = body.moTa !== undefined ? body.moTa : body.MoTa;
    }
    if (body.hinhAnhMinhChung !== undefined || body.HinhAnhMinhChung !== undefined) {
        updateData.HinhAnhMinhChung = body.hinhAnhMinhChung !== undefined ? body.hinhAnhMinhChung : body.HinhAnhMinhChung;
    }

    return farmingLogRepository.updateLog(id, updateData);
};

// ADMIN/FARMER: delete a log
export const deleteLog = async (id, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xóa nhật ký canh tác.', 403);
    }

    const existing = await farmingLogRepository.getLogById(id);
    if (!existing) {
        throw new AppError('Không tìm thấy nhật ký canh tác.', 404);
    }

    await farmingLogRepository.deleteLog(id);
};
