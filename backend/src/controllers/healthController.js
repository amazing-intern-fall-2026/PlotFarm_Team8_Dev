import { successResponse } from '../utils/response.js';
import { getPool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

export const health = async (req, res, next) => {
  try {
    const pool = getPool();
    await pool.request().query('SELECT 1 AS healthCheck');
    const data = { uptime: process.uptime(), database: 'connected' };
    successResponse(res, { message: 'OK', data });
  } catch (err) {
    // Forward to global error handler without leaking sensitive info
    next(new AppError('Database connection failed', 503));
  }
};

