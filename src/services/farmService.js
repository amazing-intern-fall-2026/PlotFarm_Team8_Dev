import * as farmRepository from '../repositories/farmRepository.js';
import { generateId } from '../utils/idGenerator.js';

export const getAllFarms = async (user) => {
  // Admin sees all farms
  if (user.role === 'ADMIN') {
    return farmRepository.getAllFarms();
  }
  // Others see only approved farms in the public list
  return farmRepository.getAllFarms('APPROVED');
};

export const getMyFarms = async (user) => {
  if (user.role !== 'FARMER') {
    throw new Error('Chỉ Farmer mới có danh sách Farm của mình.');
  }
  // Farmer owns farms through MaNV
  if (!user.MaNV) {
    throw new Error('Thiếu thông tin Mã Nhân Viên (MaNV).');
  }
  return farmRepository.getFarmsByFarmerId(user.MaNV);
};

export const getFarmById = async (id) => {
  const farm = await farmRepository.getFarmById(id);
  if (!farm) throw new Error('Không tìm thấy Farm.');
  return farm;
};

export const createFarm = async (farmData, user) => {
  const MaNongTrai = generateId('FARM');
  
  const data = {
    ...farmData,
    MaNongTrai,
    // If farmer, auto assign to themselves. If admin, expect it from body
    MaChuNongTrai: user.role === 'FARMER' ? user.MaNV : farmData.MaChuNongTrai,
    // Farmer's created farms are PENDING by default. Admin can create as APPROVED
    TrangThai: user.role === 'ADMIN' ? (farmData.TrangThai || 'APPROVED') : 'PENDING'
  };
  
  if (!data.MaChuNongTrai) {
    throw new Error('Thiếu thông tin chủ nông trại (MaChuNongTrai).');
  }

  return farmRepository.createFarm(data);
};

export const updateFarm = async (id, farmData, user) => {
  const farm = await farmRepository.getFarmById(id);
  if (!farm) throw new Error('Không tìm thấy Farm.');

  // Check ownership if Farmer
  if (user.role === 'FARMER' && farm.MaChuNongTrai !== user.MaNV) {
    throw new Error('FORBIDDEN');
  }

  // Prevent Farmer from changing status to bypass approval
  if (user.role === 'FARMER' && farmData.TrangThai) {
      delete farmData.TrangThai;
  }

  await farmRepository.updateFarm(id, farmData);
  return farmRepository.getFarmById(id);
};

export const deleteFarm = async (id, user) => {
  const farm = await farmRepository.getFarmById(id);
  if (!farm) throw new Error('Không tìm thấy Farm.');

  // Check ownership if Farmer
  if (user.role === 'FARMER' && farm.MaChuNongTrai !== user.MaNV) {
    throw new Error('FORBIDDEN');
  }

  await farmRepository.deleteFarm(id);
  return true;
};
