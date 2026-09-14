import * as adminRepository from '../repositories/adminRepository.js';
import { AppError } from '../utils/AppError.js';

export const getKPI = async (user) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chỉ Admin mới có quyền truy cập thống kê KPI.', 403);
    }

    const raw = await adminRepository.getKPIStats();

    const totalFarms = Number(raw.totalFarms || 0);
    const totalPlots = Number(raw.totalPlots || 0);
    const availablePlots = Number(raw.availablePlots || 0);
    const rentedPlots = Number(raw.rentedPlots || 0);
    const totalRevenue = Number(raw.totalRevenue || 0);
    const pendingCareRequests = Number(raw.pendingCareRequests || 0);
    const expiringContractsCount = Number(raw.expiringContractsCount || 0);

    const occupancyRate = totalPlots > 0 ? Number(((rentedPlots / totalPlots) * 100).toFixed(2)) : 0;

    return {
        tongSoFarm: totalFarms,
        totalFarms,
        tongSoPlot: totalPlots,
        totalPlots,
        plotTrong: availablePlots,
        availablePlots,
        plotDangThue: rentedPlots,
        rentedPlots,
        tyLeLapDay: occupancyRate,
        occupancyRate,
        tongDoanhThu: totalRevenue,
        totalRevenue,
        careRequestPending: pendingCareRequests,
        pendingCareRequests,
        contractSapHetHan: expiringContractsCount,
        expiringContractsCount,
    };
};

export const getAllUsers = async (user, query = {}) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chỉ Admin mới có quyền xem danh sách người dùng.', 403);
    }

    const filters = {};
    if (query.role) filters.role = query.role;
    if (query.status || query.trangThai) filters.status = query.status || query.trangThai;

    return adminRepository.getAllUsers(filters);
};

export const updateUserStatus = async (id, body, user) => {
    if (user?.role !== 'ADMIN') {
        throw new AppError('Chỉ Admin mới có quyền cập nhật trạng thái người dùng.', 403);
    }

    const targetUser = await adminRepository.findUserByIdOrUsername(id);
    if (!targetUser) {
        throw new AppError('Không tìm thấy người dùng.', 404);
    }

    let status = (body.status || body.trangThai || '').toUpperCase();
    if (status === 'LOCKED') {
        status = 'INACTIVE';
    }

    const validStatuses = ['ACTIVE', 'INACTIVE'];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError('Trạng thái không hợp lệ. Phải là ACTIVE hoặc INACTIVE / LOCKED.', 400);
    }

    // Prevent Admin from locking their own account
    const isSelf = targetUser.id === user.userId ||
                   targetUser.username === user.accountId ||
                   targetUser.username === user.userId;

    if (isSelf && status === 'INACTIVE') {
        throw new AppError('Không thể tự khóa tài khoản của chính bạn.', 400);
    }

    return adminRepository.updateUserStatus(targetUser, status);
};
