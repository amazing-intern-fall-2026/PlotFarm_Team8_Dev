// src/validators/authValidator.js
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// Middleware to handle validation result
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, {
      message: 'Validation failed',
      errors: errors.array(),
      statusCode: 400,
    });
  }
  next();
};

export const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 255 })
    .withMessage('Full name cannot exceed 255 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .isLength({ max: 254 })
    .withMessage('Email cannot exceed 254 characters'),
  body('phone')
    .trim()
    .matches(/^\d{9,11}$/)
    .withMessage('Phone must contain 9-11 digits'),
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address required')
    .isLength({ max: 500 })
    .withMessage('Shipping address cannot exceed 500 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 chars')
    .matches(/^[^\s]+$/)
    .withMessage('Username cannot contain spaces'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidation,
];

export const validateRegisterEmployee = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 200 })
    .withMessage('Full name cannot exceed 200 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email required')
    .isLength({ max: 254 })
    .withMessage('Email cannot exceed 254 characters'),
  body('phone')
    .trim()
    .matches(/^\d{9,11}$/)
    .withMessage('Phone must contain 9-11 digits'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 chars')
    .matches(/^[^\s]+$/)
    .withMessage('Username cannot contain spaces'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .trim()
    .isIn(['ADMIN', 'FARMER'])
    .withMessage('Role must be ADMIN or FARMER'),
  handleValidation,
];

export const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidation,
];

export const validateForgotPassword = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập tên đăng nhập hoặc email'),
  handleValidation,
];

export const validateResetPassword = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Tên đăng nhập hoặc email là bắt buộc'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc')
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP phải bao gồm đúng 6 chữ số'),
  body('newPassword')
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự'),
  handleValidation,
];

export const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Họ và tên phải từ 2 đến 255 ký tự'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\d{9,11}$/)
    .withMessage('Số điện thoại phải từ 9-11 chữ số'),
  body('shippingAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ nhận hàng không vượt quá 500 ký tự'),
  handleValidation,
];

export const validateChangePassword = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu hiện tại'),
  body('newPassword')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu mới')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  handleValidation,
];


