import * as harvestRepository from '../repositories/harvestRepository.js';
import { AppError } from '../utils/AppError.js';

// FARMER/ADMIN: create harvest schedule
export const createHarvest = async (body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền lên lịch thu hoạch.', 403);
    }

    const maHopDong = body.maHopDong || body.MaHopDong || body.contractId;
    const ngayThuHoachDuKien = body.ngayThuHoachDuKien || body.NgayThuHoachDuKien || body.expectedHarvestDate;
    const sanLuongDuKien = body.sanLuongDuKien || body.SanLuongDuKien || body.expectedQuantity;
    let diaChiGiaoHang = body.diaChiGiaoHang || body.DiaChiGiaoHang || body.deliveryAddress;
    const ghiChu = body.ghiChu || body.GhiChu || body.note;

    if (!maHopDong || !ngayThuHoachDuKien || !sanLuongDuKien) {
        throw new AppError('MaHopDong, NgayThuHoachDuKien và SanLuongDuKien là bắt buộc.', 400);
    }

    const contract = await harvestRepository.checkContract(maHopDong);
    if (!contract) {
        throw new AppError('Không tìm thấy hợp đồng thuê.', 404);
    }

    if (!diaChiGiaoHang) {
        diaChiGiaoHang = contract.DiaChiNhanHang;
    }

    if (!diaChiGiaoHang) {
        throw new AppError('Vui lòng cung cấp địa chỉ giao hàng.', 400);
    }

    const data = {
        MaHopDong: maHopDong,
        NgayThuHoachDuKien: ngayThuHoachDuKien,
        SanLuongDuKien: sanLuongDuKien,
        TrangThaiThuHoach: 'SCHEDULED',
        TrangThaiDongGoi: 'NOT_PACKED',
        TrangThaiGiaoHang: 'WAITING_PICKUP',
        DiaChiGiaoHang: diaChiGiaoHang,
        GhiChu: ghiChu || null,
    };

    return harvestRepository.createHarvest(data);
};

// CUSTOMER: get own harvests
export const getMyHarvests = async (user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể xem danh sách thu hoạch của mình.', 403);
    }
    return harvestRepository.getHarvestsByCustomerId(user.userId);
};

// FARMER/ADMIN: get all harvests
export const getAllHarvests = async (user, query = {}) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xem danh sách thu hoạch.', 403);
    }

    const filters = {};
    const contractId = query.contractId || query.MaHopDong;
    const trangThaiThuHoach = query.trangThaiThuHoach || query.TrangThaiThuHoach || query.harvestStatus || query.status;
    const trangThaiDongGoi = query.trangThaiDongGoi || query.TrangThaiDongGoi || query.packageStatus;
    const trangThaiGiaoHang = query.trangThaiGiaoHang || query.TrangThaiGiaoHang || query.deliveryStatus;

    if (contractId) filters.contractId = contractId;
    if (trangThaiThuHoach) filters.trangThaiThuHoach = trangThaiThuHoach;
    if (trangThaiDongGoi) filters.trangThaiDongGoi = trangThaiDongGoi;
    if (trangThaiGiaoHang) filters.trangThaiGiaoHang = trangThaiGiaoHang;

    if (user.role === 'FARMER') {
        filters.farmerId = user.userId;
    }

    return harvestRepository.getHarvests(filters);
};

// FARMER/ADMIN: update harvest status
export const updateHarvestStatus = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền cập nhật trạng thái thu hoạch.', 403);
    }

    const existing = await harvestRepository.getHarvestById(id);
    if (!existing) {
        throw new AppError('Không tìm thấy bản ghi thu hoạch.', 404);
    }

    const updateData = {};
    const status = body.status || body.trangThai || body.TrangThai;

    // Handle single unified flow status
    if (status) {
        const unifiedFlow = ['SCHEDULED', 'IN_PROGRESS', 'HARVESTED', 'PACKED', 'STORAGE_COOL', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
        if (!unifiedFlow.includes(status)) {
            throw new AppError(`Trạng thái không hợp lệ. Phải là một trong: ${unifiedFlow.join(', ')}.`, 400);
        }

        if (status === 'SCHEDULED' || status === 'IN_PROGRESS' || status === 'CANCELLED') {
            updateData.TrangThaiThuHoach = status;
        } else if (status === 'HARVESTED') {
            updateData.TrangThaiThuHoach = 'HARVESTED';
            if (!existing.NgayThuHoachThucTe && !body.ngayThuHoachThucTe && !body.NgayThuHoachThucTe) {
                updateData.NgayThuHoachThucTe = new Date();
            }
        } else if (status === 'PACKED') {
            updateData.TrangThaiThuHoach = 'HARVESTED';
            updateData.TrangThaiDongGoi = 'PACKED';
        } else if (status === 'STORAGE_COOL') {
            updateData.TrangThaiDongGoi = 'STORAGE_COOL';
        } else if (status === 'DELIVERING') {
            updateData.TrangThaiThuHoach = 'HARVESTED';
            updateData.TrangThaiDongGoi = 'PACKED';
            updateData.TrangThaiGiaoHang = 'DELIVERING';
        } else if (status === 'DELIVERED') {
            updateData.TrangThaiThuHoach = 'HARVESTED';
            updateData.TrangThaiGiaoHang = 'DELIVERED';
        }
    }

    // Direct overrides if provided
    const directThuHoach = body.trangThaiThuHoach || body.TrangThaiThuHoach || body.harvestStatus;
    if (directThuHoach) {
        const valid = ['SCHEDULED', 'IN_PROGRESS', 'HARVESTED', 'CANCELLED'];
        if (!valid.includes(directThuHoach)) throw new AppError('TrangThaiThuHoach không hợp lệ.', 400);
        updateData.TrangThaiThuHoach = directThuHoach;
    }

    const directDongGoi = body.trangThaiDongGoi || body.TrangThaiDongGoi || body.packageStatus;
    if (directDongGoi) {
        const valid = ['NOT_PACKED', 'PACKED', 'STORAGE_COOL'];
        if (!valid.includes(directDongGoi)) throw new AppError('TrangThaiDongGoi không hợp lệ.', 400);
        updateData.TrangThaiDongGoi = directDongGoi;
    }

    const directGiaoHang = body.trangThaiGiaoHang || body.TrangThaiGiaoHang || body.deliveryStatus;
    if (directGiaoHang) {
        const valid = ['WAITING_PICKUP', 'DELIVERING', 'DELIVERED'];
        if (!valid.includes(directGiaoHang)) throw new AppError('TrangThaiGiaoHang không hợp lệ.', 400);
        updateData.TrangThaiGiaoHang = directGiaoHang;
    }

    const sanLuongThucTe = body.sanLuongThucTe || body.SanLuongThucTe || body.actualQuantity;
    if (sanLuongThucTe !== undefined) updateData.SanLuongThucTe = sanLuongThucTe;

    const ngayThuHoachThucTe = body.ngayThuHoachThucTe || body.NgayThuHoachThucTe || body.actualHarvestDate;
    if (ngayThuHoachThucTe !== undefined) updateData.NgayThuHoachThucTe = ngayThuHoachThucTe;

    const ghiChu = body.ghiChu !== undefined ? body.ghiChu : (body.GhiChu !== undefined ? body.GhiChu : body.note);
    if (ghiChu !== undefined) updateData.GhiChu = ghiChu;

    return harvestRepository.updateHarvest(id, updateData);
};

// FARMER/ADMIN: update delivery details
export const updateHarvestDelivery = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền cập nhật thông tin giao hàng.', 403);
    }

    const existing = await harvestRepository.getHarvestById(id);
    if (!existing) {
        throw new AppError('Không tìm thấy bản ghi thu hoạch.', 404);
    }

    const updateData = {};

    const diaChiGiaoHang = body.diaChiGiaoHang || body.DiaChiGiaoHang || body.deliveryAddress;
    if (diaChiGiaoHang !== undefined) updateData.DiaChiGiaoHang = diaChiGiaoHang;

    const maVanDon = body.maVanDon || body.MaVanDon || body.trackingCode;
    if (maVanDon !== undefined) updateData.MaVanDon = maVanDon;

    const trangThaiGiaoHang = body.trangThaiGiaoHang || body.TrangThaiGiaoHang || body.deliveryStatus;
    if (trangThaiGiaoHang) {
        const valid = ['WAITING_PICKUP', 'DELIVERING', 'DELIVERED'];
        if (!valid.includes(trangThaiGiaoHang)) {
            throw new AppError('TrangThaiGiaoHang không hợp lệ.', 400);
        }
        updateData.TrangThaiGiaoHang = trangThaiGiaoHang;
    }

    const trangThaiDongGoi = body.trangThaiDongGoi || body.TrangThaiDongGoi || body.packageStatus;
    if (trangThaiDongGoi) {
        const valid = ['NOT_PACKED', 'PACKED', 'STORAGE_COOL'];
        if (!valid.includes(trangThaiDongGoi)) {
            throw new AppError('TrangThaiDongGoi không hợp lệ.', 400);
        }
        updateData.TrangThaiDongGoi = trangThaiDongGoi;
    }

    const ghiChu = body.ghiChu !== undefined ? body.ghiChu : (body.GhiChu !== undefined ? body.GhiChu : body.note);
    if (ghiChu !== undefined) updateData.GhiChu = ghiChu;

    return harvestRepository.updateHarvest(id, updateData);
};
