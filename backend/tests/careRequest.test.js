import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockCareRequestRepo = {
    getCareRequests: jest.fn(),
    getCareRequestsByCustomerId: jest.fn(),
    getCareRequestById: jest.fn(),
    checkContract: jest.fn(),
    createCareRequest: jest.fn(),
    updateCareRequestStatus: jest.fn(),
};

const mockPool = {
    request: jest.fn(() => ({
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    })),
};

jest.unstable_mockModule('../src/repositories/careRequestRepository.js', () => mockCareRequestRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
    getPool: jest.fn(() => mockPool),
    connectDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Task 07 — Care Request API Test Suite', () => {
    const customer1Token = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const customer2Token = jwt.sign({ userId: 'KH002', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/care-requests', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).post('/api/v1/care-requests').send({});
            expect(res.status).toBe(401);
        });

        test('FARMER gets 403 Forbidden (only CUSTOMER creates)', async () => {
            const res = await request(app)
                .post('/api/v1/care-requests')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD001',
                    loaiYeuCau: 'Tưới nước bổ sung',
                    moTa: 'Tưới thêm vào buổi chiều',
                });
            expect(res.status).toBe(403);
        });

        test('CUSTOMER gets 400 if required fields missing', async () => {
            const res = await request(app)
                .post('/api/v1/care-requests')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    maHopDong: 'HD001',
                });
            expect(res.status).toBe(400);
        });

        test('CUSTOMER gets 404 if contract not found', async () => {
            mockCareRequestRepo.checkContract.mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/v1/care-requests')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    maHopDong: 'HD999',
                    loaiYeuCau: 'Tưới nước',
                    moTa: 'Tưới thêm chiều nay',
                });
            expect(res.status).toBe(404);
        });

        test('CUSTOMER gets 403 if contract belongs to another customer', async () => {
            mockCareRequestRepo.checkContract.mockResolvedValueOnce({
                MaHopDong: 'HD001',
                MaKH: 'KH002', // Belongs to customer 2
            });

            const res = await request(app)
                .post('/api/v1/care-requests')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    maHopDong: 'HD001',
                    loaiYeuCau: 'Tưới nước',
                    moTa: 'Tưới thêm chiều nay',
                });
            expect(res.status).toBe(403);
        });

        test('CUSTOMER successfully creates care request (201, PENDING)', async () => {
            mockCareRequestRepo.checkContract.mockResolvedValueOnce({
                MaHopDong: 'HD001',
                MaKH: 'KH001',
            });
            mockCareRequestRepo.createCareRequest.mockResolvedValueOnce({
                MaYeuCau: 'YC001',
                MaHopDong: 'HD001',
                MaKH: 'KH001',
                LoaiYeuCau: 'Kiểm tra sâu bệnh',
                MoTa: 'Lá cây có đốm vàng bất thường',
                TrangThai: 'PENDING',
            });

            const res = await request(app)
                .post('/api/v1/care-requests')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    maHopDong: 'HD001',
                    loaiYeuCau: 'Kiểm tra sâu bệnh',
                    moTa: 'Lá cây có đốm vàng bất thường',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.MaYeuCau).toBe('YC001');
            expect(res.body.data.TrangThai).toBe('PENDING');
            expect(mockCareRequestRepo.createCareRequest).toHaveBeenCalledWith(expect.objectContaining({
                MaHopDong: 'HD001',
                MaKH: 'KH001',
                LoaiYeuCau: 'Kiểm tra sâu bệnh',
                MoTa: 'Lá cây có đốm vàng bất thường',
                TrangThai: 'PENDING',
            }));
        });
    });

    describe('GET /api/v1/care-requests/my', () => {
        test('CUSTOMER gets own care requests (200)', async () => {
            mockCareRequestRepo.getCareRequestsByCustomerId.mockResolvedValueOnce([
                { MaYeuCau: 'YC001', MaKH: 'KH001', TrangThai: 'PENDING' }
            ]);

            const res = await request(app)
                .get('/api/v1/care-requests/my')
                .set('Authorization', `Bearer ${customer1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockCareRequestRepo.getCareRequestsByCustomerId).toHaveBeenCalledWith('KH001');
        });

        test('FARMER gets 403 on /my', async () => {
            const res = await request(app)
                .get('/api/v1/care-requests/my')
                .set('Authorization', `Bearer ${farmerToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/v1/care-requests', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .get('/api/v1/care-requests')
                .set('Authorization', `Bearer ${customer1Token}`);
            expect(res.status).toBe(403);
        });

        test('FARMER gets care requests list with filters (200)', async () => {
            mockCareRequestRepo.getCareRequests.mockResolvedValueOnce([
                { MaYeuCau: 'YC001', TrangThai: 'PENDING' }
            ]);

            const res = await request(app)
                .get('/api/v1/care-requests?status=PENDING&contractId=HD001')
                .set('Authorization', `Bearer ${farmerToken}`);

            expect(res.status).toBe(200);
            expect(mockCareRequestRepo.getCareRequests).toHaveBeenCalledWith(expect.objectContaining({
                trangThai: 'PENDING',
                contractId: 'HD001',
                farmerId: 'NV001',
            }));
        });
    });

    describe('PATCH /api/v1/care-requests/:id/status', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .patch('/api/v1/care-requests/YC001/status')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({ status: 'IN_PROGRESS' });
            expect(res.status).toBe(403);
        });

        test('404 if care request not found', async () => {
            mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce(null);

            const res = await request(app)
                .patch('/api/v1/care-requests/YC999/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'IN_PROGRESS' });
            expect(res.status).toBe(404);
        });

        test('400 if invalid status provided', async () => {
            mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce({ MaYeuCau: 'YC001' });

            const res = await request(app)
                .patch('/api/v1/care-requests/YC001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'INVALID_STATUS' });
            expect(res.status).toBe(400);
        });

        test('FARMER moves status to IN_PROGRESS (200)', async () => {
            mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce({ MaYeuCau: 'YC001', TrangThai: 'PENDING' });
            mockCareRequestRepo.updateCareRequestStatus.mockResolvedValueOnce({
                MaYeuCau: 'YC001',
                TrangThai: 'IN_PROGRESS',
                NguoiXuLy: 'NV001',
            });

            const res = await request(app)
                .patch('/api/v1/care-requests/YC001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'IN_PROGRESS' });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThai).toBe('IN_PROGRESS');
            expect(mockCareRequestRepo.updateCareRequestStatus).toHaveBeenCalledWith('YC001', expect.objectContaining({
                TrangThai: 'IN_PROGRESS',
                NguoiXuLy: 'NV001',
            }));
        });

        test('FARMER resolves to COMPLETED with note, photo, CompletedAt (200)', async () => {
            mockCareRequestRepo.getCareRequestById.mockResolvedValueOnce({ MaYeuCau: 'YC001', TrangThai: 'IN_PROGRESS' });
            mockCareRequestRepo.updateCareRequestStatus.mockResolvedValueOnce({
                MaYeuCau: 'YC001',
                TrangThai: 'COMPLETED',
                GhiChuPhanHoi: 'Đã phun chế phẩm sinh học trị bọ trĩ',
                HinhAnhKetQua: 'https://example.com/resolved.jpg',
                NguoiXuLy: 'NV001',
                CompletedAt: new Date().toISOString(),
            });

            const res = await request(app)
                .patch('/api/v1/care-requests/YC001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    status: 'COMPLETED',
                    ghiChuPhanHoi: 'Đã phun chế phẩm sinh học trị bọ trĩ',
                    hinhAnhKetQua: 'https://example.com/resolved.jpg',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThai).toBe('COMPLETED');
            expect(mockCareRequestRepo.updateCareRequestStatus).toHaveBeenCalledWith('YC001', expect.objectContaining({
                TrangThai: 'COMPLETED',
                NguoiXuLy: 'NV001',
                GhiChuPhanHoi: 'Đã phun chế phẩm sinh học trị bọ trĩ',
                HinhAnhKetQua: 'https://example.com/resolved.jpg',
                CompletedAt: expect.any(Date),
            }));
        });
    });
});
