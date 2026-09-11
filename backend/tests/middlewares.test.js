import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import authenticate from '../src/middlewares/authenticate.js';
import authorize from '../src/middlewares/authorize.js';
import { JWT_SECRET } from '../src/config/config.js';

describe('Middlewares Test Suite', () => {
  describe('authenticate middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
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

    test('should return 401 if Authorization header is missing', () => {
      authenticate(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authorization token missing or malformed',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if Authorization header does not start with Bearer', () => {
      req.headers['authorization'] = 'Basic 12345';
      authenticate(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authorization token missing or malformed',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid.token.value';
      authenticate(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token không hợp lệ',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token is expired', () => {
      const expiredToken = jwt.sign(
        { userId: 'KH001', role: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: -10 }
      );
      req.headers['authorization'] = `Bearer ${expiredToken}`;
      authenticate(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token đã hết hạn',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next() and attach payload to req.user if token is valid', () => {
      const validToken = jwt.sign(
        { userId: 'KH001', role: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers['authorization'] = `Bearer ${validToken}`;
      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('KH001');
      expect(req.user.role).toBe('CUSTOMER');
    });
  });

  describe('authorize middleware', () => {
    let req, res, next;

    beforeEach(() => {
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

    test('should return 401 if req.user is missing', () => {
      req = {};
      const middleware = authorize('ADMIN');
      middleware(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthenticated',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 if user role is not allowed', () => {
      req = { user: { role: 'CUSTOMER' } };
      const middleware = authorize('ADMIN', 'FARMER');
      middleware(req, res, next);
      expect(res.statusCode).toBe(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Forbidden: insufficient role',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next() if user has permitted role', () => {
      req = { user: { role: 'ADMIN' } };
      const middleware = authorize('ADMIN', 'FARMER');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
