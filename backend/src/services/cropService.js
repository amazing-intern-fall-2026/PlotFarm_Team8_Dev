import * as cropRepo from '../repositories/cropRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllCrops = async () => {
  return await cropRepo.getAllCrops();
};

export const getCropById = async (id) => {
  const crop = await cropRepo.getCropById(id);
  if (!crop) {
    throw new AppError('Không tìm thấy cây trồng', 404);
  }
  return crop;
};

export const createCrop = async (body, user) => {
  if (user?.role !== 'ADMIN') {
    throw new AppError('Chỉ Admin mới có quyền thêm cây trồng.', 403);
  }

  const tenCayTrong = body.TenCayTrong || body.tenCayTrong;
  const loaiCay = body.LoaiCay || body.loaiCay;
  const thoiGianThuHoach = body.ThoiGianThuHoach !== undefined ? body.ThoiGianThuHoach : body.thoiGianThuHoach;

  if (!tenCayTrong || !loaiCay || thoiGianThuHoach === undefined) {
    throw new AppError('Thiếu dữ liệu bắt buộc (TenCayTrong, LoaiCay, ThoiGianThuHoach)', 400);
  }

  const parsedTime = Number(thoiGianThuHoach);
  if (isNaN(parsedTime) || parsedTime <= 0) {
    throw new AppError('ThoiGianThuHoach phải là số nguyên dương lớn hơn 0', 400);
  }

  const cropData = {
    TenCayTrong: tenCayTrong,
    LoaiCay: loaiCay,
    ThoiGianThuHoach: parsedTime,
  };

  return await cropRepo.createCrop(cropData);
};
