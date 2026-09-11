// src/middlewares/authenticate.js
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { errorResponse } from '../utils/response.js';
import { JWT_SECRET } from '../config/config.js';

/** Middleware to verify JWT and set req.user */
export default (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Missing or malformed token
    const err = new AppError('Authorization token missing or malformed', 401);
    return errorResponse(res, { message: err.message, statusCode: err.statusCode });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // attach payload for downstream use
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      const err = new AppError('Token đã hết hạn', 401);
      return errorResponse(res, { message: err.message, statusCode: err.statusCode });
    }
    const err = new AppError('Token không hợp lệ', 401);
    return errorResponse(res, { message: err.message, statusCode: err.statusCode });
  }
};
