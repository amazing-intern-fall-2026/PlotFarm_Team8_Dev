// src/validators/authValidator.js
import { body } from 'express-validator';
import { validationResult } from 'express-validator';

// Middleware to handle validation result
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Use existing errorResponse helper
    const { errorResponse } = require('../utils/response.js');
    return errorResponse(res, {
      message: 'Validation failed',
      errors: errors.array(),
      statusCode: 400,
    });
  }
  next();
};

export const validateRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('phone')
    .trim()
    .matches(/^\d{9,11}$/)
    .withMessage('Phone must contain 9-11 digits'),
  body('shippingAddress').trim().notEmpty().withMessage('Shipping address required'),
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

export const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidation,
];
