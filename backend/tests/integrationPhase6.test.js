import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

// Mocks for all repositories
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

const mockPlotRepo = {
  getAllPlots: jest.fn(),
  getPlots: jest.fn(),
  getPlotById: jest.fn(),
  createPlot: jest.fn(),
  updatePlot: jest.fn(),
  deletePlot: jest.fn(),
};

const mockFarmingLogRepo = {
  getLogs: jest.fn(),
  getLogById: jest.fn(),
  createLog: jest.fn(),
  updateLog: jest.fn(),
  deleteLog: jest.fn(),
};

const mockCareRequestRepo = {
  getCareRequests: jest.fn(),
  getCareRequestsByCustomerId: jest.fn(),
  getCareRequestById: jest.fn(),
  checkContract: jest.fn(),
  createCareRequest: jest.fn(),
  updateCareRequestStatus: jest.fn(),
};

const mockHarvestRepo = {
  getHarvests: jest.fn(),
  getHarvestsByCustomerId: jest.fn(),
  getHarvestById: jest.fn(),
  checkContract: jest.fn(),
  createHarvest: jest.fn(),
  updateHarvest: jest.fn(),
};

const mockAdminRepo = {
  getKPIStats: jest.fn(),
  getAllUsers: jest.fn(),
  findUserByIdOrUsername: jest.fn(),
  updateUserStatus: jest.fn(),
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
jest.unstable_mockModule('../src/repositories/plotRepository.js', () => mockPlotRepo);
jest.unstable_mockModule('../src/repositories/farmingLogRepository.js', () => mockFarmingLogRepo);
jest.unstable_mockModule('../src/repositories/careRequestRepository.js', () => mockCareRequestRepo);
jest.unstable_mockModule('../src/repositories/harvestRepository.js', () => mockHarvestRepo);
jest.unstable_mockModule('../src/repositories/adminRepository.js', () => mockAdminRepo);
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

describe('Phase 5 & 6 — RBAC & Multi-Role Integration Test Suite', () => {
  const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Task 28: RBAC Backend Verification
  // ══════════════════════════════════════════════════════════════════════════
  describe('Task 28 — RBAC Backend Route Protection', () => {
    describe('POST /api/v1/contracts (CUSTOMER only)', () => {
      test('FARMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .post('/api/v1/contracts')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ maODat: 'OD001', maCayTrong: 'CT001', ngayBatDau: '2026-03-01', ngayKetThuc: '2026-09-01' });
        expect(res.status).toBe(403);
      });

      test('ADMIN gets 403 Forbidden', async () => {
        const res = await request(app)
          .post('/api/v1/contracts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ maODat: 'OD001', maCayTrong: 'CT001', ngayBatDau: '2026-03-01', ngayKetThuc: '2026-09-01' });
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/v1/farming-logs (FARMER, ADMIN only)', () => {
      test('CUSTOMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .post('/api/v1/farming-logs')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ maHopDong: 'HD001', maODat: 'OD001', hoatDong: 'Tưới nước', giaiDoanCay: 'Phát triển' });
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/v1/care-requests (CUSTOMER only)', () => {
      test('FARMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .post('/api/v1/care-requests')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ maHopDong: 'HD001', loaiYeuCau: 'Bắt sâu', moTa: 'Thấy có sâu ăn lá' });
        expect(res.status).toBe(403);
      });

      test('ADMIN gets 403 Forbidden', async () => {
        const res = await request(app)
          .post('/api/v1/care-requests')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ maHopDong: 'HD001', loaiYeuCau: 'Bắt sâu', moTa: 'Thấy có sâu ăn lá' });
        expect(res.status).toBe(403);
      });
    });

    describe('PATCH /api/v1/care-requests/:id/status (FARMER, ADMIN only)', () => {
      test('CUSTOMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .patch('/api/v1/care-requests/CR001/status')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ trangThai: 'IN_PROGRESS' });
        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/v1/admin/kpi (ADMIN only)', () => {
      test('CUSTOMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .get('/api/v1/admin/kpi')
          .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
      });

      test('FARMER gets 403 Forbidden', async () => {
        const res = await request(app)
          .get('/api/v1/admin/kpi')
          .set('Authorization', `Bearer ${farmerToken}`);
        expect(res.status).toBe(403);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Task 30: Contract Creation & Plot Status Sync
  // ══════════════════════════════════════════════════════════════════════════
  describe('Task 30 — Customer Contract Creation & Plot Status Sync', () => {
    test('Customer creates contract -> plot becomes DANG_THUE -> Admin sees both', async () => {
      const mockPlot = { MaODat: 'OD001', TrangThai: 'TRONG', GiaThue: 2500000 };
      const mockCrop = { MaCayTrong: 'CT001', TenCayTrong: 'Cải ngọt' };
      const createdContract = {
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaODat: 'OD001',
        MaCayTrong: 'CT001',
        NgayBatDau: '2026-04-01',
        NgayKetThuc: '2026-10-01',
        GiaThueThucTe: 2500000,
        TienDatCoc: 2500000,
        TongTien: 15000000,
        TrangThai: 'CHO_DUYET',
      };

      mockContractRepo.checkPlotAvailability.mockResolvedValueOnce(mockPlot);
      mockContractRepo.checkCropExists.mockResolvedValueOnce(mockCrop);
      mockContractRepo.updatePlotStatus.mockResolvedValueOnce({
        MaODat: 'OD001',
        TrangThai: 'DANG_THUE',
      });
      mockContractRepo.createContract.mockResolvedValueOnce(createdContract);

      // 1. Customer creates contract
      const createRes = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          maODat: 'OD001',
          maCayTrong: 'CT001',
          soThangThue: 6,
          ghiChu: 'Thuê trồng rau sạch',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.MaHopDong).toBe('HD001');

      // Verify plot status was updated to DANG_THUE inside the transaction
      expect(mockContractRepo.updatePlotStatus).toHaveBeenCalledWith(
        'OD001',
        'DANG_THUE',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();

      // 2. Admin views contracts list
      mockContractRepo.getAllContracts.mockResolvedValueOnce([createdContract]);
      const adminContractsRes = await request(app)
        .get('/api/v1/contracts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminContractsRes.status).toBe(200);
      expect(adminContractsRes.body.data).toHaveLength(1);
      expect(adminContractsRes.body.data[0].MaHopDong).toBe('HD001');

      // 3. Admin views plots list and sees OD001 as DANG_THUE
      mockPlotRepo.getAllPlots.mockResolvedValueOnce([
        { MaODat: 'OD001', TenODat: 'Ô 01', TrangThai: 'DANG_THUE' },
      ]);
      const adminPlotsRes = await request(app)
        .get('/api/v1/plots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminPlotsRes.status).toBe(200);
      expect(adminPlotsRes.body.data[0].TrangThai).toBe('DANG_THUE');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Task 31: Care Request Flow (PENDING -> IN_PROGRESS -> COMPLETED)
  // ══════════════════════════════════════════════════════════════════════════
  describe('Task 31 — Care Request Full Progression Flow', () => {
    test('Customer creates -> Farmer accepts (IN_PROGRESS) -> Farmer completes (COMPLETED) -> Customer sees result', async () => {
      // 1. Customer creates care request
      mockCareRequestRepo.checkContract.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaODat: 'OD001',
      });
      const createdRequest = {
        MaYeuCau: 'YC001',
        MaHopDong: 'HD001',
        LoaiYeuCau: 'Bón phân',
        MoTa: 'Bón thêm phân hữu cơ vi sinh',
        TrangThai: 'PENDING',
      };
      mockCareRequestRepo.createCareRequest.mockResolvedValueOnce(createdRequest);

      const createRes = await request(app)
        .post('/api/v1/care-requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          maHopDong: 'HD001',
          loaiYeuCau: 'Bón phân',
          moTa: 'Bón thêm phân hữu cơ vi sinh',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.TrangThai).toBe('PENDING');

      // 2. Farmer accepts and moves to IN_PROGRESS
      mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce(createdRequest);
      mockCareRequestRepo.updateCareRequestStatus.mockResolvedValueOnce({
        ...createdRequest,
        TrangThai: 'IN_PROGRESS',
      });

      const inProgressRes = await request(app)
        .patch('/api/v1/care-requests/YC001/status')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ trangThai: 'IN_PROGRESS' });

      expect(inProgressRes.status).toBe(200);
      expect(inProgressRes.body.data.TrangThai).toBe('IN_PROGRESS');

      // 3. Farmer completes with response note and evidence photo
      mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce({
        ...createdRequest,
        TrangThai: 'IN_PROGRESS',
      });
      const completedRequest = {
        ...createdRequest,
        TrangThai: 'COMPLETED',
        GhiChuPhanHoi: 'Đã bón phân vi sinh và tưới đều',
        HinhAnhKetQua: 'https://example.com/evidence-bonphan.jpg',
      };
      mockCareRequestRepo.updateCareRequestStatus.mockResolvedValueOnce(completedRequest);

      const completeRes = await request(app)
        .patch('/api/v1/care-requests/YC001/status')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          trangThai: 'COMPLETED',
          ghiChuPhanHoi: 'Đã bón phân vi sinh và tưới đều',
          hinhAnhKetQua: 'https://example.com/evidence-bonphan.jpg',
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.TrangThai).toBe('COMPLETED');
      expect(completeRes.body.data.GhiChuPhanHoi).toContain('Đã bón phân');
      expect(completeRes.body.data.HinhAnhKetQua).toBe('https://example.com/evidence-bonphan.jpg');

      // 4. Customer views their care requests and verifies response
      mockCareRequestRepo.getCareRequestsByCustomerId.mockResolvedValueOnce([completedRequest]);

      const myRequestsRes = await request(app)
        .get('/api/v1/care-requests/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(myRequestsRes.status).toBe(200);
      expect(myRequestsRes.body.data[0].TrangThai).toBe('COMPLETED');
      expect(myRequestsRes.body.data[0].GhiChuPhanHoi).toBe('Đã bón phân vi sinh và tưới đều');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Task 32: Farming Log Timeline & Progress Progression
  // ══════════════════════════════════════════════════════════════════════════
  describe('Task 32 — Farming Log Real-Time Progression (30% -> 50% -> 70% -> 100%)', () => {
    test('Farmer creates initial log (30%) and updates to 100%, Customer verifies', async () => {
      // 1. Farmer creates initial log with 30% progress
      const initialLog = {
        MaNhatKy: 'NK001',
        MaHopDong: 'HD001',
        MaODat: 'OD001',
        HoatDong: 'Gieo hạt mầm',
        GiaiDoanCay: 'Nảy mầm',
        TienDoPhanTram: 30,
        MoTa: 'Gieo hạt cải xanh',
        NguoiGhi: 'NV001',
      };
      mockFarmingLogRepo.createLog.mockResolvedValueOnce(initialLog);

      const createRes = await request(app)
        .post('/api/v1/farming-logs')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          maHopDong: 'HD001',
          maODat: 'OD001',
          hoatDong: 'Gieo hạt mầm',
          giaiDoanCay: 'Nảy mầm',
          tienDoPhanTram: 30,
          moTa: 'Gieo hạt cải xanh',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.TienDoPhanTram).toBe(30);

      // 2. Customer views farming logs for contract HD001
      mockFarmingLogRepo.getLogs.mockResolvedValueOnce([initialLog]);

      const customerGet1 = await request(app)
        .get('/api/v1/farming-logs?contractId=HD001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(customerGet1.status).toBe(200);
      expect(customerGet1.body.data[0].TienDoPhanTram).toBe(30);

      // 3. Farmer updates progress to 50%
      mockFarmingLogRepo.getLogById.mockResolvedValueOnce(initialLog);
      mockFarmingLogRepo.updateLog.mockResolvedValueOnce({
        ...initialLog,
        GiaiDoanCay: 'Phát triển thân lá',
        TienDoPhanTram: 50,
      });

      const update50 = await request(app)
        .put('/api/v1/farming-logs/NK001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          giaiDoanCay: 'Phát triển thân lá',
          tienDoPhanTram: 50,
        });

      expect(update50.status).toBe(200);
      expect(update50.body.data.TienDoPhanTram).toBe(50);

      // 4. Farmer updates progress to 100% (Ready for harvest)
      mockFarmingLogRepo.getLogById.mockResolvedValueOnce({
        ...initialLog,
        TienDoPhanTram: 50,
      });
      const harvestReadyLog = {
        ...initialLog,
        GiaiDoanCay: 'Sẵn sàng thu hoạch',
        TienDoPhanTram: 100,
      };
      mockFarmingLogRepo.updateLog.mockResolvedValueOnce(harvestReadyLog);

      const update100 = await request(app)
        .put('/api/v1/farming-logs/NK001')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          giaiDoanCay: 'Sẵn sàng thu hoạch',
          tienDoPhanTram: 100,
        });

      expect(update100.status).toBe(200);
      expect(update100.body.data.TienDoPhanTram).toBe(100);

      // 5. Customer reads the updated log
      mockFarmingLogRepo.getLogs.mockResolvedValueOnce([harvestReadyLog]);

      const customerGetFinal = await request(app)
        .get('/api/v1/farming-logs?contractId=HD001')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(customerGetFinal.status).toBe(200);
      expect(customerGetFinal.body.data[0].TienDoPhanTram).toBe(100);
      expect(customerGetFinal.body.data[0].GiaiDoanCay).toBe('Sẵn sàng thu hoạch');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Task 33: Harvest & Delivery Lifecycle
  // ══════════════════════════════════════════════════════════════════════════
  describe('Task 33 — Harvest & Delivery Full Lifecycle', () => {
    test('Admin schedules -> Farmer harvests & packs -> Admin delivers -> Customer receives', async () => {
      // 1. Admin schedules harvest
      mockHarvestRepo.checkContract.mockResolvedValueOnce({
        MaHopDong: 'HD001',
        DiaChiNhanHang: '123 Đường Rau Sạch, TP.HCM',
      });
      const scheduledHarvest = {
        MaThuHoach: 'TH001',
        MaHopDong: 'HD001',
        NgayThuHoachDuKien: '2026-05-10',
        SanLuongDuKien: '50 kg',
        TrangThaiThuHoach: 'SCHEDULED',
        TrangThaiDongGoi: 'NOT_PACKED',
        TrangThaiGiaoHang: 'WAITING_PICKUP',
        DiaChiGiaoHang: '123 Đường Rau Sạch, TP.HCM',
      };
      mockHarvestRepo.createHarvest.mockResolvedValueOnce(scheduledHarvest);

      const scheduleRes = await request(app)
        .post('/api/v1/harvests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maHopDong: 'HD001',
          ngayThuHoachDuKien: '2026-05-10',
          sanLuongDuKien: '50 kg',
        });

      expect(scheduleRes.status).toBe(201);
      expect(scheduleRes.body.data.TrangThaiThuHoach).toBe('SCHEDULED');
      expect(scheduleRes.body.data.TrangThaiDongGoi).toBe('NOT_PACKED');

      // 2. Farmer starts harvest (IN_PROGRESS)
      mockHarvestRepo.getHarvestById.mockResolvedValueOnce(scheduledHarvest);
      mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
        ...scheduledHarvest,
        TrangThaiThuHoach: 'IN_PROGRESS',
      });

      const startRes = await request(app)
        .patch('/api/v1/harvests/TH001/status')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(startRes.status).toBe(200);
      expect(startRes.body.data.TrangThaiThuHoach).toBe('IN_PROGRESS');

      // 3. Farmer records actual harvest quantity (HARVESTED)
      mockHarvestRepo.getHarvestById.mockResolvedValueOnce({
        ...scheduledHarvest,
        TrangThaiThuHoach: 'IN_PROGRESS',
      });
      const harvestedData = {
        ...scheduledHarvest,
        TrangThaiThuHoach: 'HARVESTED',
        SanLuongThucTe: '52 kg',
        NgayThuHoachThucTe: '2026-05-10',
      };
      mockHarvestRepo.updateHarvest.mockResolvedValueOnce(harvestedData);

      const harvestedRes = await request(app)
        .patch('/api/v1/harvests/TH001/status')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          status: 'HARVESTED',
          sanLuongThucTe: '52 kg',
          ngayThuHoachThucTe: '2026-05-10',
        });

      expect(harvestedRes.status).toBe(200);
      expect(harvestedRes.body.data.TrangThaiThuHoach).toBe('HARVESTED');
      expect(harvestedRes.body.data.SanLuongThucTe).toBe('52 kg');

      // 4. Farmer marks packed (PACKED)
      mockHarvestRepo.getHarvestById.mockResolvedValueOnce(harvestedData);
      const packedData = {
        ...harvestedData,
        TrangThaiDongGoi: 'PACKED',
      };
      mockHarvestRepo.updateHarvest.mockResolvedValueOnce(packedData);

      const packedRes = await request(app)
        .patch('/api/v1/harvests/TH001/status')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'PACKED' });

      expect(packedRes.status).toBe(200);
      expect(packedRes.body.data.TrangThaiDongGoi).toBe('PACKED');

      // 5. Admin updates delivery status to DELIVERING with tracking number
      mockHarvestRepo.getHarvestById.mockResolvedValueOnce(packedData);
      const deliveringData = {
        ...packedData,
        TrangThaiGiaoHang: 'DELIVERING',
        MaVanDon: 'VNPOST-8823910',
      };
      mockHarvestRepo.updateHarvest.mockResolvedValueOnce(deliveringData);

      const deliveryRes = await request(app)
        .patch('/api/v1/harvests/TH001/delivery')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trangThaiGiaoHang: 'DELIVERING',
          maVanDon: 'VNPOST-8823910',
        });

      expect(deliveryRes.status).toBe(200);
      expect(deliveryRes.body.data.TrangThaiGiaoHang).toBe('DELIVERING');
      expect(deliveryRes.body.data.MaVanDon).toBe('VNPOST-8823910');

      // 6. Admin completes delivery to DELIVERED
      mockHarvestRepo.getHarvestById.mockResolvedValueOnce(deliveringData);
      const deliveredData = {
        ...deliveringData,
        TrangThaiGiaoHang: 'DELIVERED',
      };
      mockHarvestRepo.updateHarvest.mockResolvedValueOnce(deliveredData);

      const deliveredRes = await request(app)
        .patch('/api/v1/harvests/TH001/delivery')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trangThaiGiaoHang: 'DELIVERED',
        });

      expect(deliveredRes.status).toBe(200);
      expect(deliveredRes.body.data.TrangThaiGiaoHang).toBe('DELIVERED');

      // 7. Customer views their harvest and verifies all details
      mockHarvestRepo.getHarvestsByCustomerId.mockResolvedValueOnce([deliveredData]);

      const myHarvestRes = await request(app)
        .get('/api/v1/harvests/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(myHarvestRes.status).toBe(200);
      expect(myHarvestRes.body.data).toHaveLength(1);
      const item = myHarvestRes.body.data[0];
      expect(item.SanLuongDuKien).toBe('50 kg');
      expect(item.SanLuongThucTe).toBe('52 kg');
      expect(item.TrangThaiDongGoi).toBe('PACKED');
      expect(item.TrangThaiGiaoHang).toBe('DELIVERED');
      expect(item.MaVanDon).toBe('VNPOST-8823910');
      expect(item.DiaChiGiaoHang).toBe('123 Đường Rau Sạch, TP.HCM');
    });
  });
});
