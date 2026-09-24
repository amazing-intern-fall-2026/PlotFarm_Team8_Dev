import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockAppRepo = {
  createApplication: jest.fn(),
  findApplicationById: jest.fn(),
  findApplicationByUsername: jest.fn(),
  findApplicationByCCCD: jest.fn(),
  findApplicationByEmail: jest.fn(),
  findApplicationByPhone: jest.fn(),
  getAllApplications: jest.fn(),
  updateApplicationStatus: jest.fn(),
};

const mockAuthRepo = {
  findAccountByUsername: jest.fn(),
  findEmployeeByEmail: jest.fn(),
  findEmployeeByPhone: jest.fn(),
  findCustomerByEmail: jest.fn(),
  findCustomerByPhone: jest.fn(),
  createEmployee: jest.fn(),
  createAccountForEmployee: jest.fn(),
};

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.unstable_mockModule('../src/repositories/farmerApplicationRepository.js', () => mockAppRepo);
jest.unstable_mockModule('../src/repositories/authRepository.js', () => mockAuthRepo);
jest.unstable_mockModule('../src/utils/transactionHelper.js', () => ({
  runInTransaction: jest.fn(async (cb) => cb(mockTransaction)),
}));

const { default: app } = await import('../src/app.js');

describe('Farmer Application & SMS Simulation API Test Suite', () => {
  const adminToken = jwt.sign(
    { userId: 'NV999', accountId: 'admin01', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const customerToken = jwt.sign(
    { userId: 'KH001', accountId: 'customer01', role: 'CUSTOMER' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/farmer-register', () => {
    test('400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/farmer-register')
        .send({ fullName: 'Nguyễn Văn Nông' });
      expect(res.status).toBe(400);
    });

    test('400 when invalid CCCD length', async () => {
      const res = await request(app)
        .post('/api/v1/auth/farmer-register')
        .send({
          fullName: 'Nguyễn Văn Nông',
          email: 'farmer@test.com',
          phone: '0901234567',
          citizenId: '123', // invalid CCCD
          username: 'farmer_test',
          password: 'Password123',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Căn cước công dân');
    });

    test('201 when application is valid', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValue(null);
      mockAppRepo.findApplicationByUsername.mockResolvedValue(null);
      mockAppRepo.findApplicationByCCCD.mockResolvedValue(null);
      mockAppRepo.createApplication.mockResolvedValue({
        MaDon: 'DKND001',
        HoTen: 'Nguyễn Văn Nông',
        Email: 'farmer@test.com',
        DienThoai: '0901234567',
        TrangThai: 'PENDING',
        NgayDangKy: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/auth/farmer-register')
        .send({
          fullName: 'Nguyễn Văn Nông',
          email: 'farmer@test.com',
          phone: '0901234567',
          address: 'Củ Chi, TP.HCM',
          citizenId: '079123456789',
          username: 'farmer_test',
          password: 'Password123',
          experience: '5 năm làm vườn hữu cơ',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.applicationId).toBe('DKND001');
      expect(res.body.data.status).toBe('PENDING');
    });
  });

  describe('GET /api/v1/admin/farmer-applications', () => {
    test('401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/admin/farmer-applications');
      expect(res.status).toBe(401);
    });

    test('403 when user is not ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/farmer-applications')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    test('200 returns list of applications for ADMIN', async () => {
      mockAppRepo.getAllApplications.mockResolvedValue([
        {
          MaDon: 'DKND001',
          HoTen: 'Nguyễn Văn Nông',
          SoCCCD: '079123456789',
          DienThoai: '0901234567',
          TrangThai: 'PENDING',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/farmer-applications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].MaDon).toBe('DKND001');
    });
  });

  describe('POST /api/v1/admin/farmer-applications/:id/approve', () => {
    test('200 approves application and returns visual SMS payload', async () => {
      mockAppRepo.findApplicationById.mockResolvedValue({
        MaDon: 'DKND001',
        HoTen: 'Lê Văn Canh Tác',
        Email: 'farmer@plotfarm.com',
        DienThoai: '0901234567',
        SoCCCD: '079123456789',
        TenDangNhap: 'farmer01',
        MatKhauHash: 'hashed_pw',
        TrangThai: 'PENDING',
      });
      mockAuthRepo.findAccountByUsername.mockResolvedValue(null);
      mockAuthRepo.createEmployee.mockResolvedValue('NV005');
      mockAuthRepo.createAccountForEmployee.mockResolvedValue();
      mockAppRepo.updateApplicationStatus.mockResolvedValue();

      const res = await request(app)
        .post('/api/v1/admin/farmer-applications/DKND001/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.smsNotification).toBeDefined();
      expect(res.body.data.smsNotification.recipientPhone).toBe('0901234567');
      expect(res.body.data.smsNotification.message).toContain('Chúc mừng anh/chị Lê Văn Canh Tác');
    });
  });

  describe('POST /api/v1/admin/farmer-applications/:id/reject', () => {
    test('200 rejects application and returns visual rejection SMS payload', async () => {
      mockAppRepo.findApplicationById.mockResolvedValue({
        MaDon: 'DKND002',
        HoTen: 'Trần Văn Chưa Đạt',
        Email: 'test@plotfarm.com',
        DienThoai: '0909999888',
        SoCCCD: '079988776655',
        TenDangNhap: 'chuadat',
        TrangThai: 'PENDING',
      });
      mockAppRepo.updateApplicationStatus.mockResolvedValue();

      const res = await request(app)
        .post('/api/v1/admin/farmer-applications/DKND002/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Ảnh CCCD bị mờ' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.smsNotification).toBeDefined();
      expect(res.body.data.smsNotification.recipientPhone).toBe('0909999888');
      expect(res.body.data.smsNotification.message).toContain('Ảnh CCCD bị mờ');
    });
  });
});
