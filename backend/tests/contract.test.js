import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockContractRepo = {
  checkPlotAvailability: jest.fn(),
  checkCropExists: jest.fn(),
  updatePlotStatus: jest.fn(),
  createContract: jest.fn(),
  getAllContracts: jest.fn(),
  getContractsByCustomerId: jest.fn(),
  getContractById: jest.fn(),
  updateContractStatus: jest.fn(),
};

const mockTransaction = {
  begin: jest.fn().mockResolvedValue(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
};

const mockPool = {
  request: jest.fn(() => ({
    query: jest.fn(),
    input: jest.fn().mockReturnThis(),
  })),
};

jest.unstable_mockModule('../src/repositories/contractRepository.js', () => mockContractRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));
jest.unstable_mockModule('mssql', () => ({
  default: {
    Transaction: jest.fn(function () {
      return mockTransaction;
    }),
    Request: jest.fn(),
  },
  Transaction: jest.fn(function () {
    return mockTransaction;
  }),
}));

const { default: app } = await import('../src/app.js');

describe('Contract Management & Concurrency Test Suite', () => {
  const customer1Token = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const customer2Token = jwt.sign({ userId: 'KH002', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmer1Token = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmer2Token = jwt.sign({ userId: 'NV002', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. POST /api/v1/contracts (Rental & Concurrency protection)
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/contracts', () => {
    test('Customer can rent an available plot (TRONG) -> plot becomes DANG_THUE', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce({
        MaODat: 'OD001',
        GiaThue: 1000000,
        TrangThai: 'TRONG',
      });
      mockContractRepo.checkCropExists.mockResolvedValueOnce({
        MaCayTrong: 'CT001',
        ThoiGianThuHoach: 45,
      });
      mockContractRepo.updatePlotStatus.mockResolvedValueOnce({
        MaODat: 'OD001',
        TrangThai: 'DANG_THUE',
      });
      mockContractRepo.createContract.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaODat: 'OD001',
        MaCayTrong: 'CT001',
        TongTien: 3000000,
        TrangThai: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaHopDong).toBe('HD001');
      expect(res.body.data.TongTien).toBe(3000000);

      // Verify transaction flow
      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockContractRepo.checkPlotAvailability).toHaveBeenCalledWith('OD001', mockTransaction);
      expect(mockContractRepo.checkCropExists).toHaveBeenCalledWith('CT001', mockTransaction);
      expect(mockContractRepo.updatePlotStatus).toHaveBeenCalledWith('OD001', 'DANG_THUE', mockTransaction);
      expect(mockContractRepo.createContract).toHaveBeenCalledWith(
        expect.objectContaining({
          MaKH: 'KH001',
          MaODat: 'OD001',
          MaCayTrong: 'CT001',
          TongTien: 3000000,
        }),
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    test('Second Customer attempting to rent the same plot gets 400 (Prevent double booking)', async () => {
      // Plot is already DANG_THUE
      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce({
        MaODat: 'OD001',
        GiaThue: 1000000,
        TrangThai: 'DANG_THUE',
      });

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Ô Đất này hiện không trống');
      expect(mockContractRepo.createContract).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('Should rollback if atomic update fails because plot was rented right before update', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce({
        MaODat: 'OD001',
        GiaThue: 1000000,
        TrangThai: 'TRONG',
      });
      mockContractRepo.checkCropExists.mockResolvedValueOnce({
        MaCayTrong: 'CT001',
        ThoiGianThuHoach: 45,
      });
      // Atomic update fails because condition TrangThai = 'TRONG' returned null
      mockContractRepo.updatePlotStatus.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Ô Đất này hiện không còn trống');
      expect(mockContractRepo.createContract).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('Should rollback and return 404 if crop does not exist', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce({
        MaODat: 'OD001',
        GiaThue: 1000000,
        TrangThai: 'TRONG',
      });
      mockContractRepo.checkCropExists.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT999',
          soThangThue: 1,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy Cây trồng');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('Should return 404 if plot does not exist', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          maODat: 'OD999',
          maCayTrong: 'CT001',
          soThangThue: 1,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy Ô Đất');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('Non-customer role (Admin/Farmer) cannot rent plot (403)', async () => {
      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 1,
        });

      expect(res.status).toBe(403);
    });

    test('Invalid input parameters (soThangThue <= 0) return 400', async () => {
      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Dữ liệu không hợp lệ');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. GET /api/v1/contracts/my
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/contracts/my', () => {
    test('Customer can view own contracts list', async () => {
      mockContractRepo.getContractsByCustomerId.mockResolvedValueOnce([
        { MaHopDong: 'HD001', MaKH: 'KH001', MaODat: 'OD001', TrangThai: 'ACTIVE' },
      ]);

      const res = await request(app)
        .get('/api/v1/contracts/my')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(mockContractRepo.getContractsByCustomerId).toHaveBeenCalledWith('KH001');
      expect(res.body.data).toHaveLength(1);
    });

    test('Farmer or Admin calling /contracts/my gets 403', async () => {
      const res = await request(app)
        .get('/api/v1/contracts/my')
        .set('Authorization', `Bearer ${farmer1Token}`);

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. GET /api/v1/contracts (Admin & Farmer)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/contracts', () => {
    test('Admin can view all contracts', async () => {
      mockContractRepo.getAllContracts.mockResolvedValueOnce([
        { MaHopDong: 'HD001', TrangThai: 'ACTIVE' },
        { MaHopDong: 'HD002', TrangThai: 'COMPLETED' },
      ]);

      const res = await request(app)
        .get('/api/v1/contracts?trangThai=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockContractRepo.getAllContracts).toHaveBeenCalledWith({ trangThai: 'ACTIVE' });
      expect(res.body.data).toHaveLength(2);
    });

    test('Farmer can view contracts scoped to their farm', async () => {
      mockContractRepo.getAllContracts.mockResolvedValueOnce([
        { MaHopDong: 'HD001', MaChuNongTrai: 'NV001' },
      ]);

      const res = await request(app)
        .get('/api/v1/contracts')
        .set('Authorization', `Bearer ${farmer1Token}`);

      expect(res.status).toBe(200);
      expect(mockContractRepo.getAllContracts).toHaveBeenCalledWith({ farmerId: 'NV001' });
    });

    test('Customer calling /contracts gets 403', async () => {
      const res = await request(app)
        .get('/api/v1/contracts')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. GET /api/v1/contracts/:id
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/contracts/:id', () => {
    test('Customer can view their own contract by ID', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaODat: 'OD001',
      });

      const res = await request(app)
        .get('/api/v1/contracts/HD001')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.MaHopDong).toBe('HD001');
    });

    test('Customer CANNOT view another customer contract (403)', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH002', // different customer
      });

      const res = await request(app)
        .get('/api/v1/contracts/HD001')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền xem hợp đồng này');
    });

    test('Farmer can view contract for plot on their farm', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaChuNongTrai: 'NV001', // farmer 1
      });

      const res = await request(app)
        .get('/api/v1/contracts/HD001')
        .set('Authorization', `Bearer ${farmer1Token}`);

      expect(res.status).toBe(200);
    });

    test('Farmer CANNOT view contract on another farmer farm (403)', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaChuNongTrai: 'NV002', // farmer 2
      });

      const res = await request(app)
        .get('/api/v1/contracts/HD001')
        .set('Authorization', `Bearer ${farmer1Token}`);

      expect(res.status).toBe(403);
    });

    test('Admin can view any contract', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaChuNongTrai: 'NV002',
      });

      const res = await request(app)
        .get('/api/v1/contracts/HD001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    test('Returns 404 when contract is not found', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/contracts/HD999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy hợp đồng');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PATCH /api/v1/contracts/:id/status
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/contracts/:id/status', () => {
    test('Admin can update contract status to COMPLETED and free the plot', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaODat: 'OD001',
        TrangThai: 'ACTIVE',
      });
      mockContractRepo.updateContractStatus.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        TrangThai: 'COMPLETED',
      });

      const res = await request(app)
        .patch('/api/v1/contracts/HD001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trangThai: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(mockContractRepo.updateContractStatus).toHaveBeenCalledWith('HD001', 'COMPLETED', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('Customer and Farmer cannot update contract status (403)', async () => {
      const resCustomer = await request(app)
        .patch('/api/v1/contracts/HD001/status')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ trangThai: 'COMPLETED' });

      expect(resCustomer.status).toBe(403);

      const resFarmer = await request(app)
        .patch('/api/v1/contracts/HD001/status')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ trangThai: 'COMPLETED' });

      expect(resFarmer.status).toBe(403);
    });

    test('Returns 400 for invalid contract status', async () => {
      const res = await request(app)
        .patch('/api/v1/contracts/HD001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trangThai: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Trạng thái không hợp lệ');
    });

    test('Returns 404 when updating non-existent contract', async () => {
      mockContractRepo.getContractById.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/v1/contracts/HD999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trangThai: 'COMPLETED' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Không tìm thấy hợp đồng');
    });
  });
});
