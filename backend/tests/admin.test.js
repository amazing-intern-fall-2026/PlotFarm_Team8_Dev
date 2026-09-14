import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockAdminRepo = {
    getKPIStats: jest.fn(),
    getAllUsers: jest.fn(),
    findUserByIdOrUsername: jest.fn(),
    updateUserStatus: jest.fn(),
};

const mockPool = {
    request: jest.fn(() => ({
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    })),
};

jest.unstable_mockModule('../src/repositories/adminRepository.js', () => mockAdminRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
    getPool: jest.fn(() => mockPool),
    connectDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Task 09 & 10 — Admin KPI & User API Test Suite', () => {
    const customerToken = jwt.sign({ userId: 'KH001', accountId: 'customer01', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const farmerToken = jwt.sign({ userId: 'NV001', accountId: 'farmer01', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ userId: 'NV999', accountId: 'admin01', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Task 09: GET /api/v1/admin/kpi
    // ──────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/admin/kpi', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).get('/api/v1/admin/kpi');
            expect(res.status).toBe(401);
        });

        test('403 when CUSTOMER', async () => {
            const res = await request(app)
                .get('/api/v1/admin/kpi')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(403);
        });

        test('403 when FARMER', async () => {
            const res = await request(app)
                .get('/api/v1/admin/kpi')
                .set('Authorization', `Bearer ${farmerToken}`);
            expect(res.status).toBe(403);
        });

        test('200 when ADMIN, returns full KPI statistics', async () => {
            mockAdminRepo.getKPIStats.mockResolvedValueOnce({
                totalFarms: 4,
                totalPlots: 20,
                availablePlots: 12,
                rentedPlots: 8,
                totalRevenue: 24000000,
                pendingCareRequests: 3,
                expiringContractsCount: 2,
            });

            const res = await request(app)
                .get('/api/v1/admin/kpi')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.tongSoFarm).toBe(4);
            expect(res.body.data.tongSoPlot).toBe(20);
            expect(res.body.data.plotTrong).toBe(12);
            expect(res.body.data.plotDangThue).toBe(8);
            expect(res.body.data.tyLeLapDay).toBe(40); // 8/20 = 40%
            expect(res.body.data.tongDoanhThu).toBe(24000000);
            expect(res.body.data.careRequestPending).toBe(3);
            expect(res.body.data.contractSapHetHan).toBe(2);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Task 10: GET /api/v1/admin/users
    // ──────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/admin/users', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).get('/api/v1/admin/users');
            expect(res.status).toBe(401);
        });

        test('403 when CUSTOMER or FARMER', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${farmerToken}`);
            expect(res.status).toBe(403);
        });

        test('200 when ADMIN, retrieves users with role and status filters', async () => {
            mockAdminRepo.getAllUsers.mockResolvedValueOnce([
                { id: 'KH001', username: 'cust01', fullName: 'Nguyen Van A', role: 'CUSTOMER', status: 'ACTIVE' },
                { id: 'NV001', username: 'farmer01', fullName: 'Tran Van B', role: 'FARMER', status: 'ACTIVE' },
            ]);

            const res = await request(app)
                .get('/api/v1/admin/users?role=CUSTOMER&status=ACTIVE')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(mockAdminRepo.getAllUsers).toHaveBeenCalledWith({ role: 'CUSTOMER', status: 'ACTIVE' });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Task 10: PATCH /api/v1/admin/users/:id/status
    // ──────────────────────────────────────────────────────────────────────────
    describe('PATCH /api/v1/admin/users/:id/status', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).patch('/api/v1/admin/users/KH001/status').send({ status: 'INACTIVE' });
            expect(res.status).toBe(401);
        });

        test('403 when non-admin', async () => {
            const res = await request(app)
                .patch('/api/v1/admin/users/KH001/status')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ status: 'INACTIVE' });
            expect(res.status).toBe(403);
        });

        test('404 when target user not found', async () => {
            mockAdminRepo.findUserByIdOrUsername.mockResolvedValueOnce(null);

            const res = await request(app)
                .patch('/api/v1/admin/users/UNKNOWN/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'INACTIVE' });

            expect(res.status).toBe(404);
        });

        test('400 when invalid status provided', async () => {
            mockAdminRepo.findUserByIdOrUsername.mockResolvedValueOnce({
                id: 'KH001',
                username: 'cust01',
                role: 'CUSTOMER',
            });

            const res = await request(app)
                .patch('/api/v1/admin/users/KH001/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'PENDING_STATUS' });

            expect(res.status).toBe(400);
        });

        test('400 when Admin attempts to lock their own account', async () => {
            mockAdminRepo.findUserByIdOrUsername.mockResolvedValueOnce({
                id: 'NV999',
                username: 'admin01',
                role: 'ADMIN',
            });

            const res = await request(app)
                .patch('/api/v1/admin/users/NV999/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'INACTIVE' });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Không thể tự khóa tài khoản');
        });

        test('200 when locking account (LOCKED maps to INACTIVE)', async () => {
            mockAdminRepo.findUserByIdOrUsername.mockResolvedValueOnce({
                id: 'KH001',
                username: 'cust01',
                role: 'CUSTOMER',
                MaKH: 'KH001',
            });
            mockAdminRepo.updateUserStatus.mockResolvedValueOnce({
                id: 'KH001',
                username: 'cust01',
                role: 'CUSTOMER',
                status: 'INACTIVE',
            });

            const res = await request(app)
                .patch('/api/v1/admin/users/KH001/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'LOCKED' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('INACTIVE');
            expect(mockAdminRepo.updateUserStatus).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'KH001' }),
                'INACTIVE'
            );
        });

        test('200 when unlocking account (status ACTIVE)', async () => {
            mockAdminRepo.findUserByIdOrUsername.mockResolvedValueOnce({
                id: 'NV001',
                username: 'farmer01',
                role: 'FARMER',
                MaNV: 'NV001',
            });
            mockAdminRepo.updateUserStatus.mockResolvedValueOnce({
                id: 'NV001',
                username: 'farmer01',
                role: 'FARMER',
                status: 'ACTIVE',
            });

            const res = await request(app)
                .patch('/api/v1/admin/users/farmer01/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'ACTIVE' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('ACTIVE');
            expect(mockAdminRepo.updateUserStatus).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'NV001' }),
                'ACTIVE'
            );
        });
    });
});
