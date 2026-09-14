import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockFarmRepo = {
  getAllFarms: jest.fn(),
  getFarmsByFarmerId: jest.fn(),
  getFarmById: jest.fn(),
  createFarm: jest.fn(),
  updateFarm: jest.fn(),
  deleteFarm: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => ({
    query: jest.fn(),
    input: jest.fn().mockReturnThis(),
  })),
};

jest.unstable_mockModule('../src/repositories/farmRepository.js', () => mockFarmRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Farm Management API Test Suite', () => {
  const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const otherFarmerToken = jwt.sign({ userId: 'NV002', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/farms', () => {
    test('Customer sees only APPROVED farms with plot count, total area, and farmer name', async () => {
      mockFarmRepo.getAllFarms.mockResolvedValueOnce([
        {
          MaNongTrai: 'FARM001',
          TenNongTrai: 'Farm Da Lat',
          DiaChi: 'Da Lat',
          TrangThai: 'APPROVED',
          MaChuNongTrai: 'NV001',
          TenChuNongTrai: 'Nguyen Van Farmer',
          EmailChuNongTrai: 'farmer@farm.com',
          DienThoaiChuNongTrai: '0987654321',
          SoLuongPlot: 5,
          TongDienTich: 500.0,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(mockFarmRepo.getAllFarms).toHaveBeenCalledWith('APPROVED');
      expect(res.body.data[0].SoLuongPlot).toBe(5);
      expect(res.body.data[0].TongDienTich).toBe(500.0);
      expect(res.body.data[0].TenChuNongTrai).toBe('Nguyen Van Farmer');
    });

    test('Admin can see all farms or filter by status', async () => {
      mockFarmRepo.getAllFarms.mockResolvedValueOnce([
        { MaNongTrai: 'FARM001', TrangThai: 'PENDING' },
      ]);

      const res = await request(app)
        .get('/api/v1/farms?trangThai=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockFarmRepo.getAllFarms).toHaveBeenCalledWith('PENDING');
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/farms/:id', () => {
    test('Customer can view an APPROVED farm', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        TenNongTrai: 'Farm Da Lat',
        TrangThai: 'APPROVED',
        MaChuNongTrai: 'NV001',
        TenChuNongTrai: 'Nguyen Van Farmer',
        SoLuongPlot: 2,
        TongDienTich: 200,
      });

      const res = await request(app)
        .get('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.MaNongTrai).toBe('FARM001');
      expect(res.body.data.SoLuongPlot).toBe(2);
    });

    test('Customer CANNOT view a PENDING farm (403)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM002',
        TrangThai: 'PENDING',
        MaChuNongTrai: 'NV001',
      });

      const res = await request(app)
        .get('/api/v1/farms/FARM002')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('chưa được phê duyệt');
    });

    test('Farmer can view their own PENDING farm', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM002',
        TrangThai: 'PENDING',
        MaChuNongTrai: 'NV001', // matches farmerToken
      });

      const res = await request(app)
        .get('/api/v1/farms/FARM002')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
    });

    test('Farmer CANNOT view another farmer PENDING farm (403)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM002',
        TrangThai: 'PENDING',
        MaChuNongTrai: 'NV002', // different owner
      });

      const res = await request(app)
        .get('/api/v1/farms/FARM002')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
    });

    test('should return 404 when farm does not exist', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/farms/FARM999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/farms', () => {
    test('Customer CANNOT create farm (403)', async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ TenNongTrai: 'Farm 1', DiaChi: 'Da Lat' });

      expect(res.status).toBe(403);
    });

    test('Farmer creates farm with status PENDING', async () => {
      mockFarmRepo.createFarm.mockResolvedValueOnce({
        MaNongTrai: 'FARM003',
        TenNongTrai: 'Farm 3',
        DiaChi: 'Lam Dong',
        MaChuNongTrai: 'NV001',
        TrangThai: 'PENDING',
      });

      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ TenNongTrai: 'Farm 3', DiaChi: 'Lam Dong' });

      expect(res.status).toBe(201);
      expect(mockFarmRepo.createFarm).toHaveBeenCalledWith(
        expect.objectContaining({
          TenNongTrai: 'Farm 3',
          DiaChi: 'Lam Dong',
          MaChuNongTrai: 'NV001',
          TrangThai: 'PENDING',
        })
      );
    });

    test('Admin creates farm with status APPROVED by default', async () => {
      mockFarmRepo.createFarm.mockResolvedValueOnce({
        MaNongTrai: 'FARM004',
        TenNongTrai: 'Farm 4',
        DiaChi: 'Gia Lai',
        MaChuNongTrai: 'NV001',
        TrangThai: 'APPROVED',
      });

      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ TenNongTrai: 'Farm 4', DiaChi: 'Gia Lai', MaChuNongTrai: 'NV001' });

      expect(res.status).toBe(201);
      expect(mockFarmRepo.createFarm).toHaveBeenCalledWith(
        expect.objectContaining({
          TenNongTrai: 'Farm 4',
          DiaChi: 'Gia Lai',
          MaChuNongTrai: 'NV001',
          TrangThai: 'APPROVED',
        })
      );
    });

    test('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ TenNongTrai: 'Farm thieu dia chi' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thiếu dữ liệu bắt buộc');
    });
  });

  describe('PUT /api/v1/farms/:id', () => {
    test('Customer CANNOT update farm (403)', async () => {
      const res = await request(app)
        .put('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ TenNongTrai: 'Farm sua' });

      expect(res.status).toBe(403);
    });

    test('Farmer can update their own farm, but cannot change TrangThai', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV001',
        TrangThai: 'PENDING',
      });
      mockFarmRepo.updateFarm.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        TenNongTrai: 'Farm Da Lat New',
        TrangThai: 'PENDING',
      });

      const res = await request(app)
        .put('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ TenNongTrai: 'Farm Da Lat New', TrangThai: 'APPROVED' });

      expect(res.status).toBe(200);
      // Status update attempt by Farmer should be stripped
      expect(mockFarmRepo.updateFarm).toHaveBeenCalledWith('FARM001', { TenNongTrai: 'Farm Da Lat New' });
    });

    test('Farmer CANNOT update another farmer farm (403)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV002', // different owner
      });

      const res = await request(app)
        .put('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ TenNongTrai: 'Hack' });

      expect(res.status).toBe(403);
    });

    test('Admin can update any farm and change TrangThai', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV002',
        TrangThai: 'PENDING',
      });
      mockFarmRepo.updateFarm.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        TrangThai: 'APPROVED',
      });

      const res = await request(app)
        .put('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ TrangThai: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(mockFarmRepo.updateFarm).toHaveBeenCalledWith('FARM001', { TrangThai: 'APPROVED' });
    });
  });

  describe('DELETE /api/v1/farms/:id', () => {
    test('Customer CANNOT delete farm (403)', async () => {
      const res = await request(app)
        .delete('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    test('Cannot delete farm if it still has plots (400)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV001',
        SoLuongPlot: 3,
      });

      const res = await request(app)
        .delete('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Không thể xóa nông trại khi vẫn còn ô đất');
    });

    test('Farmer can delete their own farm when SoLuongPlot === 0', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV001',
        SoLuongPlot: 0,
      });
      mockFarmRepo.deleteFarm.mockResolvedValueOnce();

      const res = await request(app)
        .delete('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Xóa nông trại thành công');
      expect(mockFarmRepo.deleteFarm).toHaveBeenCalledWith('FARM001');
    });

    test('Farmer CANNOT delete another farmer farm (403)', async () => {
      mockFarmRepo.getFarmById.mockResolvedValueOnce({
        MaNongTrai: 'FARM001',
        MaChuNongTrai: 'NV002',
        SoLuongPlot: 0,
      });

      const res = await request(app)
        .delete('/api/v1/farms/FARM001')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
