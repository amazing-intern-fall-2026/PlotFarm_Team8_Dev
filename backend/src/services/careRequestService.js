import * as careRequestRepository from '../repositories/careRequestRepository.js';
import { AppError } from '../utils/AppError.js';

// CUSTOMER only: submit a new care request
export const createCareRequest = async (body, user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể gửi yêu cầu chăm sóc.', 403);
    }

    const maHopDong = body.maHopDong || body.MaHopDong || body.contractId;
    const loaiYeuCau = body.loaiYeuCau || body.LoaiYeuCau || body.requestType;
    const moTa = body.moTa || body.MoTa || body.description;

    if (!maHopDong || !loaiYeuCau || !moTa) {
        throw new AppError('MaHopDong, LoaiYeuCau và MoTa là bắt buộc.', 400);
    }

    // Verify contract exists and belongs to this customer
    const contract = await careRequestRepository.checkContract(maHopDong);
    if (!contract) {
        throw new AppError('Không tìm thấy hợp đồng thuê.', 404);
    }

    if (contract.MaKH !== user.userId) {
        throw new AppError('Bạn không có quyền gửi yêu cầu cho hợp đồng này.', 403);
    }

    const data = {
        MaHopDong: maHopDong,
        MaKH: user.userId,
        LoaiYeuCau: loaiYeuCau,
        MoTa: moTa.trim(),
        TrangThai: 'PENDING',
    };

    return careRequestRepository.createCareRequest(data);
};

// CUSTOMER: get own care requests
export const getMyCareRequests = async (user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể xem yêu cầu của mình.', 403);
    }
    return careRequestRepository.getCareRequestsByCustomerId(user.userId);
};

// FARMER/ADMIN: get all care requests
export const getAllCareRequests = async (user, query = {}) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xem danh sách yêu cầu chăm sóc.', 403);
    }

    const filters = {};
    const trangThai = query.trangThai || query.status || query.TrangThai;
    const contractId = query.contractId || query.MaHopDong;
    const plotId = query.plotId || query.MaODat;
    const customerId = query.customerId || query.MaKH;

    if (trangThai) filters.trangThai = trangThai;
    if (contractId) filters.contractId = contractId;
    if (plotId) filters.plotId = plotId;
    if (customerId) filters.customerId = customerId;

    if (user.role === 'FARMER') {
        filters.farmerId = user.userId;
    }

    return careRequestRepository.getCareRequests(filters);
};

// FARMER/ADMIN: process care request status
export const updateCareRequestStatus = async (id, body, user) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xử lý yêu cầu chăm sóc.', 403);
    }

    const existing = await careRequestRepository.getCareRequestById(id);
    if (!existing) {
        throw new AppError('Không tìm thấy yêu cầu chăm sóc.', 404);
    }

    // Map and validate status
    let status = body.trangThai || body.status || body.TrangThai;
    if (status === 'CANNOT_RESOLVE') status = 'REJECTED';

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}.`, 400);
    }

    const ghiChuPhanHoi = body.ghiChuPhanHoi !== undefined ? body.ghiChuPhanHoi : (body.GhiChuPhanHoi !== undefined ? body.GhiChuPhanHoi : body.farmerNote);
    const hinhAnhKetQua = body.hinhAnhKetQua !== undefined ? body.hinhAnhKetQua : (body.HinhAnhKetQua !== undefined ? body.HinhAnhKetQua : body.evidenceImage);

    const updateData = {
        TrangThai: status,
        NguoiXuLy: user.userId,
    };

    if (ghiChuPhanHoi !== undefined) updateData.GhiChuPhanHoi = ghiChuPhanHoi;
    if (hinhAnhKetQua !== undefined) updateData.HinhAnhKetQua = hinhAnhKetQua;

    if (status === 'COMPLETED' || status === 'REJECTED') {
        updateData.CompletedAt = new Date();
    }

    return careRequestRepository.updateCareRequestStatus(id, updateData);
};
