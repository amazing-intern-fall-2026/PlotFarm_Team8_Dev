import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockPlotRepo = {
  getAllPlots: jest.fn(),
  getPlotById: jest.fn(),
  createPlot: jest.fn(),
  updatePlot: jest.fn(),
  updatePlotSensor: jest.fn(),
  deletePlot: jest.fn(),
};

const mockFarmRepo = {
  getFarmById: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => ({
    query: jest.fn(),
    input: jest.fn().mockReturnThis(),
  })),
};

jest.unstable_mockModule('../src/repositories/plotRepository.js', () => mockPlotRepo);
jest.unstable_mockModule('../src/repositories/farmRepository.js', () => mockFarmRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Plot Management API Test Suite', () => {
  const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const otherFarmerToken = jwt.sign({ userId: 'NV002', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GET /api/v1/plots
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/plots', () => {
    test('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/v1/plots');
      expect(res.status).toBe(401);
    });

    test('Customer can view plots list', async () => {
      mockPlotRepo.getAllPlots.mockResolvedValueOnce([
        { MaODat: 'OD001', TenODat: 'Ô đất A1', CameraUrl: null, TrangThai: 'TRONG' },
        { MaODat: 'OD002', TenODat: 'Ô đất A2', CameraUrl: 'https://cam.local/2', TrangThai: 'DANG_THUE' },
      ]);

      const res = await request(app)
        .get('/api/v1/plots')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].CameraUrl).toBeNull();
    });

    test('Farmer can view plots list', async () => {
      mockPlotRepo.getAllPlots.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/v1/plots')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Admin can view plots list with filters (farmId, trangThai)', async () => {
      mockPlotRepo.getAllPlots.mockResolvedValueOnce([
        { MaODat: 'OD001', MaNongTrai: 'NT001', TrangThai: 'TRONG' },
      ]);

      const res = await request(app)
        .get('/api/v1/plots?farmId=NT001&trangThai=TRONG')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockPlotRepo.getAllPlots).toHaveBeenCalledWith({
        farmId: 'NT001',
        trangThai: 'TRONG',
      });
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. GET /api/v1/plots/:id
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/plots/:id', () => {
    test('Customer can view a plot by id, and CameraUrl = null returns properly', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        TenODat: 'Ô đất A1',
        MaNongTrai: 'NT001',
        TenNongTrai: 'Nông trại Đà Lạt',
        CameraUrl: null,
        HinhAnhThumbnail: null,
        DoAmDat: null,
        NhietDo: null,
        DoPH: null,
        AnhSangLux: null,
      });

      const res = await request(app)
        .get('/api/v1/plots/OD001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaODat).toBe('OD001');
      expect(res.body.data.CameraUrl).toBeNull();
    });

    test('should return 404 when plot does not exist', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/plots/OD999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Không tìm thấy ô đất');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. POST /api/v1/plots
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/plots', () => {
    test('Customer cannot create plot (403)', async () => {
      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaNongTrai: 'NT001',
          TenODat: 'Ô 1',
          DienTich: 50,
          GiaThue: 500000,
        });

      expect(res.status).toBe(403);
    });

    test('Admin can create plot on any farm', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'NT001',
        MaChuNongTrai: 'NV001',
      });
      mockPlotRepo.createPlot.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaNongTrai: 'NT001',
        TenODat: 'Ô 1',
        DienTich: 50,
        GiaThue: 500000,
        TrangThai: 'TRONG',
        CameraUrl: null,
      });

      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          MaNongTrai: 'NT001',
          TenODat: 'Ô 1',
          DienTich: 50,
          GiaThue: 500000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaODat).toBe('OD001');
    });

    test('Farmer can create plot on their own farm', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'NT001',
        MaChuNongTrai: 'NV001', // matches farmerToken userId
      });
      mockPlotRepo.createPlot.mockResolvedValueOnce({
        MaODat: 'OD002',
        MaNongTrai: 'NT001',
        TenODat: 'Ô 2',
        DienTich: 60,
        GiaThue: 600000,
      });

      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          MaNongTrai: 'NT001',
          TenODat: 'Ô 2',
          DienTich: 60,
          GiaThue: 600000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.MaODat).toBe('OD002');
    });

    test('Farmer CANNOT create plot on another farmer farm (403)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'NT002',
        MaChuNongTrai: 'NV002', // different owner
      });

      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${farmerToken}`) // userId is NV001
        .send({
          MaNongTrai: 'NT002',
          TenODat: 'Ô 2',
          DienTich: 60,
          GiaThue: 600000,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền quản lý ô đất');
    });

    test('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenODat: 'Ô thiếu dữ liệu',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thiếu dữ liệu bắt buộc');
    });

    test('should return 404 when farm does not exist', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/plots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          MaNongTrai: 'NT999',
          TenODat: 'Ô 1',
          DienTich: 50,
          GiaThue: 500000,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy nông trại');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PUT /api/v1/plots/:id
  // ──────────────────────────────────────────────────────────────────────────
  describe('PUT /api/v1/plots/:id', () => {
    test('Customer cannot update plot (403)', async () => {
      const res = await request(app)
        .put('/api/v1/plots/OD001')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ TenODat: 'Tên mới' });

      expect(res.status).toBe(403);
    });

    test('Admin can update any plot', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaNongTrai: 'NT001',
        MaChuNongTrai: 'NV002',
      });
      mockPlotRepo.updatePlot.mockResolvedValueOnce({
        MaODat: 'OD001',
        TenODat: 'Tên mới admin',
      });

      const res = await request(app)
        .put('/api/v1/plots/OD001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ TenODat: 'Tên mới admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.TenODat).toBe('Tên mới admin');
    });

    test('Farmer can update plot on their own farm', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaNongTrai: 'NT001',
        MaChuNongTrai: 'NV001', // farmerToken owner
      });
      mockPlotRepo.updatePlot.mockResolvedValueOnce({
        MaODat: 'OD001',
        CameraUrl: 'rtsp://cam.stream/new',
      });

      const res = await request(app)
        .put('/api/v1/plots/OD001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ CameraUrl: 'rtsp://cam.stream/new' });

      expect(res.status).toBe(200);
      expect(res.body.data.CameraUrl).toBe('rtsp://cam.stream/new');
    });

    test('Farmer CANNOT update plot on another farmer farm (403)', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaNongTrai: 'NT001',
        MaChuNongTrai: 'NV002', // different owner
      });

      const res = await request(app)
        .put('/api/v1/plots/OD001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ TenODat: 'Hacking plot' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền sửa ô đất này');
    });

    test('should return 404 when updating non-existent plot', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/v1/plots/OD999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ TenODat: 'Non-existent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy ô đất');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PATCH /api/v1/plots/:id/sensor
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/plots/:id/sensor', () => {
    test('Customer cannot update sensor (403)', async () => {
      const res = await request(app)
        .patch('/api/v1/plots/OD001/sensor')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ NhietDo: 28.5 });

      expect(res.status).toBe(403);
    });

    test('Admin can update sensor on any plot', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaChuNongTrai: 'NV001',
      });
      mockPlotRepo.updatePlotSensor.mockResolvedValueOnce({
        MaODat: 'OD001',
        DoAmDat: 65.5,
        NhietDo: 28.0,
        DoPH: 6.8,
        AnhSangLux: 15000,
      });

      const res = await request(app)
        .patch('/api/v1/plots/OD001/sensor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          DoAmDat: 65.5,
          NhietDo: 28.0,
          DoPH: 6.8,
          AnhSangLux: 15000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.DoAmDat).toBe(65.5);
    });

    test('Farmer can update sensor on their own farm plot', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaChuNongTrai: 'NV001', // farmerToken owner
      });
      mockPlotRepo.updatePlotSensor.mockResolvedValueOnce({
        MaODat: 'OD001',
        DoAmDat: 70.0,
      });

      const res = await request(app)
        .patch('/api/v1/plots/OD001/sensor')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ DoAmDat: 70.0 });

      expect(res.status).toBe(200);
      expect(res.body.data.DoAmDat).toBe(70.0);
    });

    test('Farmer CANNOT update sensor on another farmer farm plot (403)', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce({
        MaODat: 'OD001',
        MaChuNongTrai: 'NV002', // different owner
      });

      const res = await request(app)
        .patch('/api/v1/plots/OD001/sensor')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ DoAmDat: 70.0 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền cập nhật cảm biến');
    });

    test('should return 404 when updating sensor for non-existent plot', async () => {
      mockPlotRepo.getPlotById.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/v1/plots/OD999/sensor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ NhietDo: 25 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy ô đất');
    });
  });
});
