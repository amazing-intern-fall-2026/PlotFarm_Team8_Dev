import { jest } from '@jest/globals';
import errorHandler from '../src/middlewares/errorHandler.js';
import { AppError } from '../src/utils/AppError.js';

describe('Error Handler Middleware Test Suite', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'POST', originalUrl: '/api/v1/auth/register' };
    res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json: jest.fn(function (data) {
        this.body = data;
        return this;
      }),
    };
    next = jest.fn();
  });

  test('should map MSSQL 2627 (Duplicate Key) to 409 Conflict', () => {
    const sqlError = new Error('Violation of UNIQUE KEY constraint');
    sqlError.number = 2627;

    errorHandler(sqlError, req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dữ liệu đã tồn tại trong hệ thống (Duplicate Key).',
      })
    );
  });

  test('should map MSSQL 2601 (Duplicate Unique Index) to 409 Conflict', () => {
    const sqlError = new Error('Cannot insert duplicate key row in object');
    sqlError.number = 2601;

    errorHandler(sqlError, req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dữ liệu đã tồn tại trong hệ thống (Duplicate Key).',
      })
    );
  });

  test('should map MSSQL 547 (Foreign Key Violation) to 400 Bad Request', () => {
    const sqlError = new Error('The INSERT statement conflicted with the FOREIGN KEY constraint');
    sqlError.number = 547;

    errorHandler(sqlError, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dữ liệu tham chiếu không hợp lệ hoặc vi phạm khóa ngoại (Foreign Key Violation).',
      })
    );
  });

  test('should handle AppError with custom status code', () => {
    const customError = new AppError('Resource not found', 404);

    errorHandler(customError, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Resource not found',
      })
    );
  });

  test('should fallback to 500 for generic server errors without leaking stack trace', () => {
    const genericError = new Error('Unexpected database fault');

    errorHandler(genericError, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body).not.toHaveProperty('stack');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unexpected database fault',
      })
    );
  });
});
