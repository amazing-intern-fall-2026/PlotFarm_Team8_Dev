import * as farmRepository from '../repositories/farmRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllFarms = async (user, filters = {}) => {
  if (user?.role === 'ADMIN') {
    const status = filters.trangThai || filters.status || null;
    return farmRepository.getAllFarms(status);
  }
  return farmRepository.getAllFarms('APPROVED');
};

export const getMyFarms = async (user) => {
  if (user?.role !== 'FARMER') {
    throw new AppError('Chỉ Farmer mới có danh sách Farm của mình.', 403);
  }
  if (!user.userId) {
    throw new AppError('Thiếu thông tin Mã Nhân Viên.', 400);
  }
  return farmRepository.getFarmsByFarmerId(user.userId);
};

export const getFarmById = async (id, user) => {
  const farm = await farmRepository.getFarmById(id);
  if (!farm) throw new AppError('Không tìm thấy Farm.', 404);

  if (user?.role === 'CUSTOMER' && farm.TrangThai !== 'APPROVED') {
    throw new AppError('Nông trại chưa được phê duyệt.', 403);
  }

  if (user?.role === 'FARMER' && farm.TrangThai !== 'APPROVED' && farm.MaChuNongTrai !== user.userId) {
    throw new AppError('Bạn không có quyền xem Nông trại này.', 403);
  }

  return farm;
};

export const createFarm = async (farmData, user) => {
  if (!farmData.TenNongTrai || !farmData.DiaChi) {
    throw new AppError('Thiếu dữ liệu bắt buộc (TenNongTrai, DiaChi)', 400);
  }

  const data = {
    ...farmData,
    MaChuNongTrai: user.role === 'ADMIN' ? (farmData.MaChuNongTrai || user.userId) : user.userId,
    TrangThai: user.role === 'ADMIN' ? (farmData.TrangThai || 'APPROVED') : 'PENDING',
  };
  return farmRepository.createFarm(data);
};

export const updateFarm = async (id, farmData, user) => {
  const existingFarm = await farmRepository.getFarmById(id);
  if (!existingFarm) throw new AppError('Không tìm thấy Farm.', 404);

  if (user?.role === 'FARMER' && existingFarm.MaChuNongTrai !== user.userId) {
    throw new AppError('Bạn không có quyền sửa Nông trại này.', 403);
  }

  const updateData = { ...farmData };
  if (user?.role === 'FARMER' && updateData.TrangThai) {
    delete updateData.TrangThai;
  }

  return farmRepository.updateFarm(id, updateData);
};

export const deleteFarm = async (id, user) => {
  const existingFarm = await farmRepository.getFarmById(id);
  if (!existingFarm) throw new AppError('Không tìm thấy Farm.', 404);

  if (user?.role === 'FARMER' && existingFarm.MaChuNongTrai !== user.userId) {
    throw new AppError('Bạn không có quyền xóa Nông trại này.', 403);
  }

  if (existingFarm.SoLuongPlot > 0) {
    throw new AppError('Không thể xóa nông trại khi vẫn còn ô đất.', 400);
  }

  await farmRepository.deleteFarm(id);
};
