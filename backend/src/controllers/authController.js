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

export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const result = await authService.requestPasswordReset(identifier);
    successResponse(res, {
      message: 'Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn',
      data: result,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    const result = await authService.resetPassword({ identifier, otp, newPassword });
    successResponse(res, {
      message: result.message,
      data: { username: result.username },
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateUserProfile(req.body, req.user);
    successResponse(res, {
      message: 'Cập nhật thông tin hồ sơ thành công',
      data: { user: updatedUser },
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changeUserPassword(req.body, req.user);
    successResponse(res, {
      message: result.message,
      data: null,
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
};
