import * as farmService from '../services/farmService.js';

export const getFarms = async (req, res, next) => {
  try {
    const farms = await farmService.getAllFarms(req.user);
    res.status(200).json({ success: true, data: farms });
  } catch (error) {
    next(error);
  }
};

export const getMyFarms = async (req, res, next) => {
  try {
    const farms = await farmService.getMyFarms(req.user);
    res.status(200).json({ success: true, data: farms });
  } catch (error) {
    if (error.message === 'Chỉ Farmer mới có danh sách Farm của mình.') {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getFarm = async (req, res, next) => {
  try {
    const farm = await farmService.getFarmById(req.params.id);
    res.status(200).json({ success: true, data: farm });
  } catch (error) {
    if (error.message === 'Không tìm thấy Farm.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createFarm = async (req, res, next) => {
  try {
    const { TenNongTrai, DiaChi, MaChuNongTrai, TrangThai } = req.body;
    
    if (!TenNongTrai || !DiaChi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp TenNongTrai và DiaChi.'
      });
    }

    const newFarm = await farmService.createFarm({ TenNongTrai, DiaChi, MaChuNongTrai, TrangThai }, req.user);
    res.status(201).json({ success: true, message: 'Tạo Nông trại thành công', data: newFarm });
  } catch (error) {
    if (error.message === 'Thiếu thông tin chủ nông trại (MaChuNongTrai).') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateFarm = async (req, res, next) => {
  try {
    const updatedFarm = await farmService.updateFarm(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Cập nhật Nông trại thành công', data: updatedFarm });
  } catch (error) {
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên Farm này.' });
    }
    if (error.message === 'Không tìm thấy Farm.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteFarm = async (req, res, next) => {
  try {
    await farmService.deleteFarm(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Xóa Nông trại thành công' });
  } catch (error) {
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên Farm này.' });
    }
    if (error.message === 'Không tìm thấy Farm.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};
