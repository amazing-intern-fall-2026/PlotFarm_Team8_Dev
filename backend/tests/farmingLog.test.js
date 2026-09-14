import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockFarmingLogRepo = {
    getLogs: jest.fn(),
    getLogById: jest.fn(),
    createLog: jest.fn(),
    updateLog: jest.fn(),
    deleteLog: jest.fn(),
};

const mockPool = {
    request: jest.fn(() => ({
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    })),
};

jest.unstable_mockModule('../src/repositories/farmingLogRepository.js', () => mockFarmingLogRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
    getPool: jest.fn(() => mockPool),
    connectDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Task 06 — Farming Log API Test Suite', () => {
    const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/farming-logs', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).get('/api/v1/farming-logs');
            expect(res.status).toBe(401);
        });

        test('CUSTOMER: retrieves logs filtered by customer id', async () => {
            mockFarmingLogRepo.getLogs.mockResolvedValueOnce([
                { MaNhatKy: 'NK001', HoatDong: 'Tuoi nuoc', MaKH: 'KH001' }
            ]);

            const res = await request(app)
                .get('/api/v1/farming-logs')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockFarmingLogRepo.getLogs).toHaveBeenCalledWith(expect.objectContaining({ maKH: 'KH001' }));
        });

        test('FARMER: retrieves all logs with contractId and plotId filter', async () => {
            mockFarmingLogRepo.getLogs.mockResolvedValueOnce([
                { MaNhatKy: 'NK001', MaHopDong: 'HD001', MaODat: 'OD001' }
            ]);

            const res = await request(app)
                .get('/api/v1/farming-logs?contractId=HD001&plotId=OD001')
                .set('Authorization', `Bearer ${farmerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockFarmingLogRepo.getLogs).toHaveBeenCalledWith({ contractId: 'HD001', plotId: 'OD001' });
        });
    });

    describe('POST /api/v1/farming-logs', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .post('/api/v1/farming-logs')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    maHopDong: 'HD001',
                    maODat: 'OD001',
                    hoatDong: 'Gieo hạt',
                    giaiDoanCay: 'Gieo mầm',
                });

            expect(res.status).toBe(403);
        });

        test('FARMER gets 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/farming-logs')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    hoatDong: 'Gieo hạt',
                });

            expect(res.status).toBe(400);
        });

        test('FARMER gets 400 if tienDoPhanTram is invalid (> 100)', async () => {
            const res = await request(app)
                .post('/api/v1/farming-logs')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD001',
                    maODat: 'OD001',
                    hoatDong: 'Gieo hạt',
                    giaiDoanCay: 'Gieo mầm',
                    tienDoPhanTram: 150,
                });

            expect(res.status).toBe(400);
        });

        test('FARMER can create farming log successfully (201)', async () => {
            mockFarmingLogRepo.createLog.mockResolvedValueOnce({
                MaNhatKy: 'NK001',
                MaHopDong: 'HD001',
                MaODat: 'OD001',
                HoatDong: 'Bón phân hữu cơ',
                GiaiDoanCay: 'Phát triển lá',
                TienDoPhanTram: 25,
                NguoiGhi: 'NV001',
            });

            const res = await request(app)
                .post('/api/v1/farming-logs')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD001',
                    maODat: 'OD001',
                    hoatDong: 'Bón phân hữu cơ',
                    giaiDoanCay: 'Phát triển lá',
                    tienDoPhanTram: 25,
                    moTa: 'Bón phân trùn quế đợt 1',
                    hinhAnhMinhChung: 'https://example.com/photo.jpg',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.MaNhatKy).toBe('NK001');
            expect(mockFarmingLogRepo.createLog).toHaveBeenCalledWith(expect.objectContaining({
                MaHopDong: 'HD001',
                MaODat: 'OD001',
                HoatDong: 'Bón phân hữu cơ',
                GiaiDoanCay: 'Phát triển lá',
                TienDoPhanTram: 25,
                NguoiGhi: 'NV001',
            }));
        });
    });

    describe('PUT /api/v1/farming-logs/:id', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .put('/api/v1/farming-logs/NK001')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ hoatDong: 'Sửa nhật ký' });

            expect(res.status).toBe(403);
        });

        test('404 if log not found', async () => {
            mockFarmingLogRepo.getLogById.mockResolvedValueOnce(null);

            const res = await request(app)
                .put('/api/v1/farming-logs/NK999')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ hoatDong: 'Sửa' });

            expect(res.status).toBe(404);
        });

        test('FARMER updates log successfully (200)', async () => {
            mockFarmingLogRepo.getLogById.mockResolvedValueOnce({ MaNhatKy: 'NK001' });
            mockFarmingLogRepo.updateLog.mockResolvedValueOnce({
                MaNhatKy: 'NK001',
                HoatDong: 'Tưới nước nhỏ giọt bổ sung',
                TienDoPhanTram: 30,
            });

            const res = await request(app)
                .put('/api/v1/farming-logs/NK001')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    hoatDong: 'Tưới nước nhỏ giọt bổ sung',
                    tienDoPhanTram: 30,
                });

            expect(res.status).toBe(200);
            expect(res.body.data.HoatDong).toBe('Tưới nước nhỏ giọt bổ sung');
        });
    });

    describe('DELETE /api/v1/farming-logs/:id', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .delete('/api/v1/farming-logs/NK001')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(403);
        });

        test('FARMER/ADMIN can delete log (200)', async () => {
            mockFarmingLogRepo.getLogById.mockResolvedValueOnce({ MaNhatKy: 'NK001' });
            mockFarmingLogRepo.deleteLog.mockResolvedValueOnce();

            const res = await request(app)
                .delete('/api/v1/farming-logs/NK001')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(mockFarmingLogRepo.deleteLog).toHaveBeenCalledWith('NK001');
        });
    });
});
