import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockAuthService = {
  registerUser: jest.fn(),
  registerEmployee: jest.fn(),
  loginUser: jest.fn(),
  getCurrentUser: jest.fn(),
};

const mockRequest = { query: jest.fn() };
const mockPool = { request: jest.fn(() => mockRequest) };

jest.unstable_mockModule('../src/services/authService.js', () => mockAuthService);
jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('API Integration Test Suite (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/health', () => {
    test('should return 200 with OK status and database connected', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ healthCheck: 1 }] });

      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OK');
      expect(res.body.data.database).toBe('connected');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    test('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: '',
          email: 'invalid-email',
          phone: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    test('should return 201 on valid registration', async () => {
      mockAuthService.registerUser.mockResolvedValueOnce({
        account: { username: 'testuser' },
        customer: { id: 'KH001', fullName: 'Test User', email: 'test@farm.com' },
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@farm.com',
          phone: '0987654321',
          shippingAddress: '123 Street',
          username: 'testuser',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.account.username).toBe('testuser');
    });
  });

  describe('POST /api/v1/auth/register-employee', () => {
    test('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-employee')
        .send({
          fullName: 'Staff Member',
          email: 'staff@farm.com',
          phone: '0987654321',
          username: 'staff01',
          password: 'Password123',
          role: 'FARMER',
        });

      expect(res.status).toBe(401);
    });

    test('should return 403 if user is not ADMIN', async () => {
      const customerToken = jwt.sign(
        { userId: 'KH001', role: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .post('/api/v1/auth/register-employee')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Staff Member',
          email: 'staff@farm.com',
          phone: '0987654321',
          username: 'staff01',
          password: 'Password123',
          role: 'FARMER',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: insufficient role');
    });

    test('should return 201 when called by an ADMIN with valid body', async () => {
      const adminToken = jwt.sign(
        { userId: 'NV001', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockAuthService.registerEmployee.mockResolvedValueOnce({
        account: { username: 'staff01', role: 'FARMER' },
        employee: { id: 'NV002', fullName: 'Staff Member', email: 'staff@farm.com' },
      });

      const res = await request(app)
        .post('/api/v1/auth/register-employee')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Staff Member',
          email: 'staff@farm.com',
          phone: '0987654321',
          username: 'staff01',
          password: 'Password123',
          role: 'FARMER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee.fullName).toBe('Staff Member');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should return 200 with token and user profile on successful login', async () => {
      mockAuthService.loginUser.mockResolvedValueOnce({
        accessToken: 'mock_jwt_token',
        user: {
          id: 'KH001',
          accountId: 'testuser',
          fullName: 'Test User',
          email: 'test@farm.com',
          userType: 'CUSTOMER',
          role: 'CUSTOMER',
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock_jwt_token');
      expect(res.body.data.user.id).toBe('KH001');
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    test('should return 200 with user data when token is valid', async () => {
      const token = jwt.sign(
        { userId: 'KH001', userType: 'CUSTOMER', role: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockAuthService.getCurrentUser.mockResolvedValueOnce({
        id: 'KH001',
        fullName: 'Test User',
        email: 'test@farm.com',
        userType: 'CUSTOMER',
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Test User');
    });
  });
});
