import { errorResponse } from '../utils/response.js';

export default (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  // MSSQL specific error codes
  if (err.number === 2627 || err.number === 2601) {
    status = 409;
    message = 'Dữ liệu đã tồn tại trong hệ thống (Duplicate Key).';
  } else if (err.number === 547) {
    status = 400;
    message = 'Dữ liệu tham chiếu không hợp lệ hoặc vi phạm khóa ngoại (Foreign Key Violation).';
  }

  // Log internal errors for debugging
  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR ${status}] ${req?.method || ''} ${req?.originalUrl || ''}:`, err);
  }

  errorResponse(res, { message, errors, statusCode: status });
};

