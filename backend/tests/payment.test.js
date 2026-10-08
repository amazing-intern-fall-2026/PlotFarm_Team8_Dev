import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  JWT_SECRET,
  VNP_HASH_SECRET,
  MOMO_SECRET_KEY,
  MOMO_ACCESS_KEY,
  MOMO_PARTNER_CODE,
  VIETQR_WEBHOOK_SECRET,
} from '../src/config/config.js';

const mockPaymentRepo = {
  createPayment: jest.fn(),
  getPaymentById: jest.fn(),
  getPaymentForUpdate: jest.fn(),
  getPaymentByContentOrOrder: jest.fn(),
  getPaymentsByCustomerId: jest.fn(),
  getAllPayments: jest.fn(),
  updatePaymentStatus: jest.fn(),
};

const mockContractRepo = {
  checkPlotAvailability: jest.fn(),
  checkCropExists: jest.fn(),
  createContract: jest.fn(),
  activateContract: jest.fn(),
  updatePlotStatus: jest.fn(),
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

jest.unstable_mockModule('../src/repositories/paymentRepository.js', () => mockPaymentRepo);
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

describe('PlotFarm Multi-Gateway Payment Test Suite (VietQR, VNPay, MoMo)', () => {
  const customer1Token = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
  const customer2Token = jwt.sign({ userId: 'KH002', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. VIETQR MODULE ───────────────────────────────────────────────────────
  describe('1. VIETQR Gateway', () => {
    it('initiate VIETQR: tao giao dich va tra ve QR Napas 247 link', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD001', GiaThue: 500000, TrangThai: 'TRONG' });
      mockContractRepo.checkCropExists.mockResolvedValue({ MaCayTrong: 'CT001' });
      mockContractRepo.createContract.mockResolvedValue({ MaHopDong: 'HD001', MaODat: 'OD001', TrangThai: 'PENDING' });
      mockPaymentRepo.createPayment.mockResolvedValue({
        MaThanhToan: 'TT001',
        MaHopDong: 'HD001',
        SoTien: 1500000,
        TrangThai: 'PENDING',
        PhuongThuc: 'VIETQR',
        NoiDungCK: 'PF THUE OD001 KH001',
      });

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ maODat: 'OD001', maCayTrong: 'CT001', soThangThue: 3, phuongThuc: 'VIETQR' });

      expect(res.status).toBe(201);
      expect(res.body.data.method).toBe('VIETQR');
      expect(res.body.data.qrCodeUrl).toContain('vietqr.io');
    });

    it('vietqr-webhook: xu ly webhook bien dong so du thanh cong', async () => {
      mockPaymentRepo.getPaymentForUpdate.mockResolvedValue({
        MaThanhToan: 'TT001',
        MaHopDong: 'HD001',
        MaODat: 'OD001',
        SoTien: 1500000,
        TrangThai: 'PENDING',
      });
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD001', TrangThai: 'TRONG' });
      mockPaymentRepo.updatePaymentStatus.mockResolvedValue({ MaThanhToan: 'TT001', TrangThai: 'COMPLETED' });

      const payload = {
        paymentId: 'TT001',
        transferAmount: 1500000,
        referenceCode: 'FT262601001',
        content: 'PF THUE OD001 KH001 TT001',
      };
      const signature = crypto
        .createHmac('sha256', VIETQR_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .set('x-webhook-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPaymentRepo.updatePaymentStatus).toHaveBeenCalledWith(
        'TT001',
        'COMPLETED',
        'FT262601001',
        mockTransaction,
        expect.stringContaining('VietQR')
      );
    });
  });

  // ─── 2. VNPAY MODULE ────────────────────────────────────────────────────────
  describe('2. VNPay Gateway', () => {
    it('initiate VNPAY: tao redirect payment URL co sap xep ASCII va HMAC-SHA512', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD002', GiaThue: 1000000, TrangThai: 'TRONG' });
      mockContractRepo.checkCropExists.mockResolvedValue({ MaCayTrong: 'CT001' });
      mockContractRepo.createContract.mockResolvedValue({ MaHopDong: 'HD002', MaODat: 'OD002', TrangThai: 'PENDING' });
      mockPaymentRepo.createPayment.mockResolvedValue({
        MaThanhToan: 'TT002',
        MaHopDong: 'HD002',
        SoTien: 3000000,
        TrangThai: 'PENDING',
        PhuongThuc: 'VNPAY',
        NoiDungCK: 'PF THUE OD002 KH001',
      });

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ maODat: 'OD002', maCayTrong: 'CT001', soThangThue: 3, phuongThuc: 'VNPAY' });

      expect(res.status).toBe(201);
      expect(res.body.data.method).toBe('VNPAY');
      expect(res.body.data.paymentUrl).toContain('sandbox.vnpayment.vn');
      expect(res.body.data.paymentUrl).toContain('vnp_SecureHash=');
      expect(res.body.data.paymentUrl).toContain('vnp_Amount=300000000'); // amount * 100
    });

    it('vnpay-ipn: xac thuc IPN hop le -> RspCode 00, kich hoat hop dong', async () => {
      mockPaymentRepo.getPaymentForUpdate.mockResolvedValue({
        MaThanhToan: 'TT002',
        MaHopDong: 'HD002',
        MaODat: 'OD002',
        SoTien: 3000000,
        TrangThai: 'PENDING',
      });
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD002', TrangThai: 'TRONG' });
      mockPaymentRepo.updatePaymentStatus.mockResolvedValue({ MaThanhToan: 'TT002', TrangThai: 'COMPLETED' });

      const rawParams = {
        vnp_Amount: '300000000',
        vnp_BankCode: 'NCB',
        vnp_OrderInfo: 'Thanh toan don hang TT002',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'PLOTFARM01',
        vnp_TransactionNo: '14234567',
        vnp_TxnRef: 'TT002',
      };

      // Build valid checksum
      const sortedKeys = Object.keys(rawParams).sort();
      const signData = sortedKeys.map((k) => `${k}=${encodeURIComponent(rawParams[k]).replace(/%20/g, '+')}`).join('&');
      const hash = crypto.createHmac('sha512', VNP_HASH_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');

      const res = await request(app)
        .get('/api/v1/payments/vnpay-ipn')
        .query({ ...rawParams, vnp_SecureHash: hash });

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('00');
      expect(res.body.Message).toBe('Confirm Success');
      expect(mockContractRepo.activateContract).toHaveBeenCalledWith('HD002', mockTransaction);
    });

    it('vnpay-ipn: sai checksum tra ve RspCode 97', async () => {
      const res = await request(app)
        .get('/api/v1/payments/vnpay-ipn')
        .query({ vnp_TxnRef: 'TT002', vnp_SecureHash: 'invalid_checksum' });

      expect(res.status).toBe(200);
      expect(res.body.RspCode).toBe('97');
    });

    it('vnpay-return: redirect ve Frontend URL ma khong thay doi DB', async () => {
      const res = await request(app)
        .get('/api/v1/payments/vnpay-return')
        .query({ vnp_TxnRef: 'TT002', vnp_ResponseCode: '00', vnp_Amount: '300000000' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/payment-return?method=VNPAY');
      expect(mockPaymentRepo.updatePaymentStatus).not.toHaveBeenCalled();
    });
  });

  // ─── 3. MOMO MODULE ─────────────────────────────────────────────────────────
  describe('3. MoMo Gateway', () => {
    it('initiate MOMO: tao MoMo checkout link', async () => {
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD003', GiaThue: 2000000, TrangThai: 'TRONG' });
      mockContractRepo.checkCropExists.mockResolvedValue({ MaCayTrong: 'CT001' });
      mockContractRepo.createContract.mockResolvedValue({ MaHopDong: 'HD003', MaODat: 'OD003', TrangThai: 'PENDING' });
      mockPaymentRepo.createPayment.mockResolvedValue({
        MaThanhToan: 'TT003',
        MaHopDong: 'HD003',
        SoTien: 2000000,
        TrangThai: 'PENDING',
        PhuongThuc: 'MOMO',
        NoiDungCK: 'PF THUE OD003 KH001',
      });

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ maODat: 'OD003', maCayTrong: 'CT001', soThangThue: 1, phuongThuc: 'MOMO' });

      expect(res.status).toBe(201);
      expect(res.body.data.method).toBe('MOMO');
      expect(res.body.data.paymentUrl).toBeDefined();
    });

    it('momo-ipn: xac thuc IPN hop le voi resultCode 0 -> kich hoat hop dong', async () => {
      mockPaymentRepo.getPaymentForUpdate.mockResolvedValue({
        MaThanhToan: 'TT003',
        MaHopDong: 'HD003',
        MaODat: 'OD003',
        SoTien: 2000000,
        TrangThai: 'PENDING',
      });
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD003', TrangThai: 'TRONG' });
      mockPaymentRepo.updatePaymentStatus.mockResolvedValue({ MaThanhToan: 'TT003', TrangThai: 'COMPLETED' });

      const body = {
        partnerCode: MOMO_PARTNER_CODE,
        orderId: 'TT003',
        requestId: 'REQ_001',
        amount: 2000000,
        orderInfo: 'Thanh toan don hang TT003',
        orderType: 'momo_wallet',
        transId: 987654321,
        resultCode: 0,
        message: 'Successful',
        payType: 'qr',
        responseTime: 1699999999,
        extraData: '',
      };

      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${body.amount}&extraData=&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
      const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/momo-ipn')
        .send({ ...body, signature });

      expect(res.status).toBe(200);
      expect(res.body.resultCode).toBe(0);
      expect(mockContractRepo.activateContract).toHaveBeenCalledWith('HD003', mockTransaction);
      expect(mockContractRepo.updatePlotStatus).toHaveBeenCalledWith('OD003', 'DANG_THUE', mockTransaction);
    });

    it('momo-ipn: sai chu ky tra ve resultCode 99', async () => {
      const res = await request(app)
        .post('/api/v1/payments/momo-ipn')
        .send({ orderId: 'TT003', amount: 2000000, signature: 'invalid_sig' });

      expect(res.status).toBe(200);
      expect(res.body.resultCode).toBe(99);
    });
  });

  // ─── 4. COMMON CORE OPERATIONS ──────────────────────────────────────────────
  describe('4. Core Operations & Concurrency Safeguards', () => {
    it('confirmPayment manual: xac nhan giao dich thanh cong', async () => {
      mockPaymentRepo.getPaymentForUpdate.mockResolvedValue({
        MaThanhToan: 'TT001',
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        MaODat: 'OD001',
        TrangThai: 'PENDING',
      });
      mockContractRepo.checkPlotAvailability.mockResolvedValue({ MaODat: 'OD001', TrangThai: 'TRONG' });
      mockPaymentRepo.updatePaymentStatus.mockResolvedValue({ MaThanhToan: 'TT001', TrangThai: 'COMPLETED' });

      const res = await request(app)
        .post('/api/v1/payments/TT001/confirm')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send();

      expect(res.status).toBe(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('cancelPayment: khach hang huy giao dich PENDING thanh cong', async () => {
      mockPaymentRepo.getPaymentForUpdate.mockResolvedValue({
        MaThanhToan: 'TT001',
        MaHopDong: 'HD001',
        MaKH: 'KH001',
        TrangThai: 'PENDING',
      });
      mockPaymentRepo.updatePaymentStatus.mockResolvedValue({ MaThanhToan: 'TT001', TrangThai: 'FAILED' });

      const res = await request(app)
        .post('/api/v1/payments/TT001/cancel')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ lyDo: 'Huy don do chon nham cay' });

      expect(res.status).toBe(200);
      expect(mockContractRepo.updateContractStatus).toHaveBeenCalledWith('HD001', 'CANCELLED', mockTransaction);
    });
  });
});
