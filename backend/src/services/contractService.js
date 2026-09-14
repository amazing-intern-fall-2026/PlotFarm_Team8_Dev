import * as contractRepository from '../repositories/contractRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { AppError } from '../utils/AppError.js';

// ─── Original Function ────────────────────────────────────────────────────────

export const createContract = async (payload, user) => {
    // User must be CUSTOMER
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể tạo hợp đồng.', 403);
    }

    const maODat = payload.maODat || payload.MaODat;
    const maCayTrong = payload.maCayTrong || payload.MaCayTrong;
    const soThangThueRaw = payload.soThangThue !== undefined ? payload.soThangThue : payload.SoThangThue;
    const soThangThue = Number(soThangThueRaw);
    
    // Validate inputs
    if (!maODat || !maCayTrong || !soThangThueRaw || isNaN(soThangThue) || soThangThue <= 0) {
        throw new AppError('Dữ liệu không hợp lệ. Vui lòng cung cấp mã ô đất, mã cây trồng và số tháng thuê hợp lệ.', 400);
    }

    return runInTransaction(async (transaction) => {
        // 1. Check Plot Availability with row lock
        const plot = await contractRepository.checkPlotAvailability(maODat, transaction);
        if (!plot) {
            throw new AppError('Không tìm thấy Ô Đất.', 404);
        }
        if (plot.TrangThai !== 'TRONG') {
            throw new AppError('Ô Đất này hiện không trống.', 400);
        }

        // 2. Check Crop Exists
        const crop = await contractRepository.checkCropExists(maCayTrong, transaction);
        if (!crop) {
            throw new AppError('Không tìm thấy Cây trồng.', 404);
        }

        // 3. Calculate Dates and Total Price
        const ngayBatDau = new Date();
        const ngayKetThuc = new Date();
        ngayKetThuc.setMonth(ngayKetThuc.getMonth() + soThangThue);
        
        const tongTien = Number(plot.GiaThue) * soThangThue;

        // 4. Update Plot Status to DANG_THUE (must be TRONG)
        const updatedPlot = await contractRepository.updatePlotStatus(maODat, 'DANG_THUE', transaction);
        if (!updatedPlot) {
            throw new AppError('Ô Đất này hiện không còn trống.', 400);
        }

        // 5. Create Contract
        const contractData = {
            MaKH: user.userId, // Authenticated Customer ID
            MaODat: maODat,
            MaCayTrong: maCayTrong,
            NgayBatDau: ngayBatDau,
            NgayKetThuc: ngayKetThuc,
            TongTien: tongTien
        };
        
        const newContract = await contractRepository.createContract(contractData, transaction);
        return newContract;
    });
};

// ─── Extended Functions ───────────────────────────────────────────────────────

// CUSTOMER: get own contracts only
export const getMyContracts = async (user) => {
    if (user?.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể xem hợp đồng của mình.', 403);
    }
    return contractRepository.getContractsByCustomerId(user.userId);
};

// ADMIN/FARMER: get all contracts with optional status/farm filter
export const getAllContracts = async (user, query = {}) => {
    if (!['ADMIN', 'FARMER'].includes(user?.role)) {
        throw new AppError('Bạn không có quyền xem tất cả hợp đồng.', 403);
    }
    const filters = {};
    if (query.trangThai || query.status) filters.trangThai = query.trangThai || query.status;
    if (query.farmId || query.MaNongTrai) filters.farmId = query.farmId || query.MaNongTrai;
    if (query.customerId || query.MaKH) filters.customerId = query.customerId || query.MaKH;
    
    // Farmer only sees contracts on their assigned farms
    if (user.role === 'FARMER') {
        filters.farmerId = user.userId;
    }
    return contractRepository.getAllContracts(filters);
};

// All roles: ADMIN sees all; FARMER sees own farm's contracts; CUSTOMER sees only own
export const getContractById = async (id, user) => {
    const contract = await contractRepository.getContractById(id);
    if (!contract) {
        throw new AppError('Không tìm thấy hợp đồng.', 404);
    }

    // CUSTOMER may only view their own contract
    if (user?.role === 'CUSTOMER' && contract.MaKH !== user.userId) {
        throw new AppError('Bạn không có quyền xem hợp đồng này.', 403);
    }

    // FARMER may only view contracts on their assigned farm
    if (user?.role === 'FARMER' && contract.MaChuNongTrai !== user.userId) {
        throw new AppError('Bạn không có quyền xem hợp đồng này.', 403);
    }

    return contract;
};

// ADMIN only: update contract status in transaction
export const updateContractStatus = async (id, status, user) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chỉ Admin mới có thể cập nhật trạng thái hợp đồng.', 403);
    }

    const validStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}.`, 400);
    }

    const contract = await contractRepository.getContractById(id);
    if (!contract) {
        throw new AppError('Không tìm thấy hợp đồng.', 404);
    }

    return runInTransaction(async (transaction) => {
        return contractRepository.updateContractStatus(id, status, transaction);
    });
};
