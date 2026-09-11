// src/validators/authValidator.js
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// Middleware to handle validation result
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return errorResponse(res, {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
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

