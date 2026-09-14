import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockCropRepo = {
  getAllCrops: jest.fn(),
  getCropById: jest.fn(),
  createCrop: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => ({
    query: jest.fn(),
    input: jest.fn().mockReturnThis(),
  })),
};

jest.unstable_mockModule('../src/repositories/cropRepository.js', () => mockCropRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Crop Management API Test Suite', () => {
  const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/crops', () => {
    test('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/crops');
      expect(res.status).toBe(401);
    });

    test('Customer can view crops', async () => {
      mockCropRepo.getAllCrops.mockResolvedValueOnce([
        { MaCayTrong: 'CT001', TenCayTrong: 'Cà chua', LoaiCay: 'Rau ăn quả', ThoiGianThuHoach: 60 },
      ]);

      const res = await request(app)
        .get('/api/v1/crops')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].TenCayTrong).toBe('Cà chua');
    });

    test('Farmer can view crops', async () => {
      mockCropRepo.getAllCrops.mockResolvedValueOnce([
        { MaCayTrong: 'CT001', TenCayTrong: 'Cà chua', LoaiCay: 'Rau ăn quả', ThoiGianThuHoach: 60 },
        { MaCayTrong: 'CT002', TenCayTrong: 'Xà lách', LoaiCay: 'Rau ăn lá', ThoiGianThuHoach: 30 },
      ]);

      const res = await request(app)
        .get('/api/v1/crops')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/crops/:id', () => {
    test('Customer can view crop by ID', async () => {
      mockCropRepo.getCropById.mockResolvedValueOnce({
        MaCayTrong: 'CT001',
        TenCayTrong: 'Cà chua',
        LoaiCay: 'Rau ăn quả',
        ThoiGianThuHoach: 60,
      });

      const res = await request(app)
        .get('/api/v1/crops/CT001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaCayTrong).toBe('CT001');
    });

    test('Farmer can view crop by ID', async () => {
      mockCropRepo.getCropById.mockResolvedValueOnce({
        MaCayTrong: 'CT001',
        TenCayTrong: 'Cà chua',
        LoaiCay: 'Rau ăn quả',
        ThoiGianThuHoach: 60,
      });

      const res = await request(app)
        .get('/api/v1/crops/CT001')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.MaCayTrong).toBe('CT001');
    });

    test('should return 404 when crop is not found', async () => {
      mockCropRepo.getCropById.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/crops/CT999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy cây trồng');
    });
  });

  describe('POST /api/v1/crops', () => {
    test('Admin can create a new crop', async () => {
      mockCropRepo.createCrop.mockResolvedValueOnce({
        MaCayTrong: 'CT003',
        TenCayTrong: 'Dưa chuột',
        LoaiCay: 'Rau ăn quả',
        ThoiGianThuHoach: 45,
      });

      const res = await request(app)
        .post('/api/v1/crops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCayTrong: 'Dưa chuột',
          LoaiCay: 'Rau ăn quả',
          ThoiGianThuHoach: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaCayTrong).toBe('CT003');
    });

    test('Customer CANNOT create crop (403)', async () => {
      const res = await request(app)
        .post('/api/v1/crops')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          TenCayTrong: 'Dưa chuột',
          LoaiCay: 'Rau ăn quả',
          ThoiGianThuHoach: 45,
        });

      expect(res.status).toBe(403);
    });

    test('Farmer CANNOT create crop (403)', async () => {
      const res = await request(app)
        .post('/api/v1/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          TenCayTrong: 'Dưa chuột',
          LoaiCay: 'Rau ăn quả',
          ThoiGianThuHoach: 45,
        });

      expect(res.status).toBe(403);
    });

    test('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/crops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCayTrong: 'Cây thiếu thông tin',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thiếu dữ liệu bắt buộc');
    });

    test('should return 400 when ThoiGianThuHoach is <= 0', async () => {
      const res = await request(app)
        .post('/api/v1/crops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCayTrong: 'Cây âm ngày',
          LoaiCay: 'Rau',
          ThoiGianThuHoach: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ThoiGianThuHoach phải là số nguyên dương');
    });
  });
});
