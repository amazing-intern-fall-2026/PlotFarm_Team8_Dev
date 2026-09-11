import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    successResponse(res, {
      message: 'Đăng ký thành công',
      data: result,
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

export const registerEmployee = async (req, res, next) => {
  try {
    // Note: In production, this should be protected by Admin role
    const result = await authService.registerEmployee(req.body);
    successResponse(res, {
      message: 'Đăng ký nhân viên thành công',
      data: result,
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    successResponse(res, {
      message: 'Đăng nhập thành công',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user);
    if (!user) {
      throw new AppError('User not found', 401);
    }
    successResponse(res, {
      message: 'Lấy thông tin thành công',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};
