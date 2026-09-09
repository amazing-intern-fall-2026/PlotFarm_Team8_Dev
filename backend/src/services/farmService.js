import * as farmRepository from '../repositories/farmRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllFarms = async (user) => {
  if (user.role === 'ADMIN') {
    return farmRepository.getAllFarms();
  }
  return farmRepository.getAllFarms('APPROVED');
};

export const getMyFarms = async (user) => {
  if (user.role !== 'FARMER') {
    throw new AppError('Chỉ Farmer mới có danh sách Farm của mình.', 403);
  }
  if (!user.userId) { // In JWT payload, we mapped MaNV to userId
    throw new AppError('Thiếu thông tin Mã Nhân Viên.', 400);
  }
  return farmRepository.getFarmsByFarmerId(user.userId);
};

export const getFarmById = async (id) => {
  const farm = await farmRepository.getFarmById(id);
  if (!farm) throw new AppError('Không tìm thấy Farm.', 404);
  return farm;
};

export const createFarm = async (farmData, user) => {
  const data = {
    ...farmData,
    MaChuNongTrai: user.userId, // Link to the farmer creating it
    TrangThai: 'PENDING' // Defaults to PENDING, Admin will approve
  };
  return farmRepository.createFarm(data);
};

export const updateFarm = async (id, farmData, user) => {
  const existingFarm = await farmRepository.getFarmById(id);
  if (!existingFarm) throw new AppError('Không tìm thấy Farm.', 404);

  // If user is a FARMER, they can only update their own farm
  if (user.role === 'FARMER' && existingFarm.MaChuNongTrai !== user.userId) {
    throw new AppError('Bạn không có quyền sửa Nông trại này.', 403);
  }

  // A Farmer cannot change the status to APPROVED themselves
  const updateData = { ...farmData };
  if (user.role === 'FARMER' && updateData.TrangThai) {
    delete updateData.TrangThai; // remove status update attempt
  }

  return farmRepository.updateFarm(id, updateData);
};

export const deleteFarm = async (id, user) => {
  const existingFarm = await farmRepository.getFarmById(id);
  if (!existingFarm) throw new AppError('Không tìm thấy Farm.', 404);

  if (user.role === 'FARMER' && existingFarm.MaChuNongTrai !== user.userId) {
    throw new AppError('Bạn không có quyền xóa Nông trại này.', 403);
  }

  await farmRepository.deleteFarm(id);
};
