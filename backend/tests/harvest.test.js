import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockHarvestRepo = {
    getHarvests: jest.fn(),
    getHarvestsByCustomerId: jest.fn(),
    getHarvestById: jest.fn(),
    checkContract: jest.fn(),
    createHarvest: jest.fn(),
    updateHarvest: jest.fn(),
};

const mockPool = {
    request: jest.fn(() => ({
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    })),
};

jest.unstable_mockModule('../src/repositories/harvestRepository.js', () => mockHarvestRepo);
jest.unstable_mockModule('../src/config/database.js', () => ({
    getPool: jest.fn(() => mockPool),
    connectDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Task 08 — Harvest API Test Suite', () => {
    const customerToken = jwt.sign({ userId: 'KH001', role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '1h' });
    const farmerToken = jwt.sign({ userId: 'NV001', role: 'FARMER' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ userId: 'NV999', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/harvests', () => {
        test('401 when unauthenticated', async () => {
            const res = await request(app).post('/api/v1/harvests').send({});
            expect(res.status).toBe(401);
        });

        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .post('/api/v1/harvests')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    maHopDong: 'HD001',
                    ngayThuHoachDuKien: '2026-10-01',
                    sanLuongDuKien: '50 kg',
                });
            expect(res.status).toBe(403);
        });

        test('FARMER gets 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/harvests')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD001',
                });
            expect(res.status).toBe(400);
        });

        test('FARMER gets 404 if contract does not exist', async () => {
            mockHarvestRepo.checkContract.mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/v1/harvests')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD999',
                    ngayThuHoachDuKien: '2026-10-01',
                    sanLuongDuKien: '50 kg',
                    diaChiGiaoHang: '123 Đường Nông Nghiệp',
                });
            expect(res.status).toBe(404);
        });

        test('FARMER creates harvest schedule successfully (201)', async () => {
            mockHarvestRepo.checkContract.mockResolvedValueOnce({
                MaHopDong: 'HD001',
                DiaChiNhanHang: '123 Đường Nông Nghiệp, Quận 1',
            });
            mockHarvestRepo.createHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                MaHopDong: 'HD001',
                NgayThuHoachDuKien: '2026-10-01',
                SanLuongDuKien: '50 kg',
                TrangThaiThuHoach: 'SCHEDULED',
                TrangThaiDongGoi: 'NOT_PACKED',
                TrangThaiGiaoHang: 'WAITING_PICKUP',
                DiaChiGiaoHang: '123 Đường Nông Nghiệp, Quận 1',
            });

            const res = await request(app)
                .post('/api/v1/harvests')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    maHopDong: 'HD001',
                    ngayThuHoachDuKien: '2026-10-01',
                    sanLuongDuKien: '50 kg',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.MaThuHoach).toBe('TH001');
            expect(res.body.data.TrangThaiThuHoach).toBe('SCHEDULED');
            expect(mockHarvestRepo.createHarvest).toHaveBeenCalledWith(expect.objectContaining({
                MaHopDong: 'HD001',
                SanLuongDuKien: '50 kg',
                TrangThaiThuHoach: 'SCHEDULED',
                TrangThaiDongGoi: 'NOT_PACKED',
                TrangThaiGiaoHang: 'WAITING_PICKUP',
            }));
        });
    });

    describe('GET /api/v1/harvests/my', () => {
        test('CUSTOMER gets own harvests (200)', async () => {
            mockHarvestRepo.getHarvestsByCustomerId.mockResolvedValueOnce([
                { MaThuHoach: 'TH001', MaHopDong: 'HD001', SanLuongDuKien: '50 kg' }
            ]);

            const res = await request(app)
                .get('/api/v1/harvests/my')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(mockHarvestRepo.getHarvestsByCustomerId).toHaveBeenCalledWith('KH001');
        });

        test('FARMER gets 403 on /my', async () => {
            const res = await request(app)
                .get('/api/v1/harvests/my')
                .set('Authorization', `Bearer ${farmerToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/v1/harvests', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .get('/api/v1/harvests')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(403);
        });

        test('FARMER retrieves harvests with status & contract filter (200)', async () => {
            mockHarvestRepo.getHarvests.mockResolvedValueOnce([
                { MaThuHoach: 'TH001', TrangThaiThuHoach: 'SCHEDULED' }
            ]);

            const res = await request(app)
                .get('/api/v1/harvests?status=SCHEDULED&contractId=HD001')
                .set('Authorization', `Bearer ${farmerToken}`);

            expect(res.status).toBe(200);
            expect(mockHarvestRepo.getHarvests).toHaveBeenCalledWith(expect.objectContaining({
                trangThaiThuHoach: 'SCHEDULED',
                contractId: 'HD001',
                farmerId: 'NV001',
            }));
        });
    });

    describe('PATCH /api/v1/harvests/:id/status', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .patch('/api/v1/harvests/TH001/status')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ status: 'IN_PROGRESS' });
            expect(res.status).toBe(403);
        });

        test('404 if harvest record not found', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce(null);

            const res = await request(app)
                .patch('/api/v1/harvests/TH999/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'IN_PROGRESS' });
            expect(res.status).toBe(404);
        });

        test('FARMER moves status to IN_PROGRESS (200)', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce({ MaThuHoach: 'TH001', TrangThaiThuHoach: 'SCHEDULED' });
            mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiThuHoach: 'IN_PROGRESS',
            });

            const res = await request(app)
                .patch('/api/v1/harvests/TH001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'IN_PROGRESS' });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThaiThuHoach).toBe('IN_PROGRESS');
        });

        test('FARMER marks as HARVESTED with actual yield (200)', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce({ MaThuHoach: 'TH001', TrangThaiThuHoach: 'IN_PROGRESS' });
            mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiThuHoach: 'HARVESTED',
                SanLuongThucTe: '52 kg',
                NgayThuHoachThucTe: '2026-10-02',
            });

            const res = await request(app)
                .patch('/api/v1/harvests/TH001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    status: 'HARVESTED',
                    sanLuongThucTe: '52 kg',
                    ngayThuHoachThucTe: '2026-10-02',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThaiThuHoach).toBe('HARVESTED');
            expect(res.body.data.SanLuongThucTe).toBe('52 kg');
        });

        test('FARMER updates to PACKED (200)', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce({ MaThuHoach: 'TH001', TrangThaiThuHoach: 'HARVESTED' });
            mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiThuHoach: 'HARVESTED',
                TrangThaiDongGoi: 'PACKED',
            });

            const res = await request(app)
                .patch('/api/v1/harvests/TH001/status')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({ status: 'PACKED' });

            expect(res.status).toBe(200);
            expect(mockHarvestRepo.updateHarvest).toHaveBeenCalledWith('TH001', expect.objectContaining({
                TrangThaiThuHoach: 'HARVESTED',
                TrangThaiDongGoi: 'PACKED',
            }));
        });
    });

    describe('PATCH /api/v1/harvests/:id/delivery', () => {
        test('CUSTOMER gets 403 Forbidden', async () => {
            const res = await request(app)
                .patch('/api/v1/harvests/TH001/delivery')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ maVanDon: 'VN123456789' });
            expect(res.status).toBe(403);
        });

        test('FARMER updates delivery details with cold storage & tracking code (200)', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiThuHoach: 'HARVESTED',
                TrangThaiDongGoi: 'PACKED',
                TrangThaiGiaoHang: 'WAITING_PICKUP',
            });
            mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiDongGoi: 'STORAGE_COOL',
                TrangThaiGiaoHang: 'DELIVERING',
                DiaChiGiaoHang: '456 Đường Nguyễn Trãi, Quận 5',
                MaVanDon: 'VN987654321',
            });

            const res = await request(app)
                .patch('/api/v1/harvests/TH001/delivery')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    trangThaiDongGoi: 'STORAGE_COOL',
                    trangThaiGiaoHang: 'DELIVERING',
                    diaChiGiaoHang: '456 Đường Nguyễn Trãi, Quận 5',
                    maVanDon: 'VN987654321',
                    ghiChu: 'Bảo quản nhiệt độ 5 độ C',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThaiDongGoi).toBe('STORAGE_COOL');
            expect(res.body.data.TrangThaiGiaoHang).toBe('DELIVERING');
            expect(res.body.data.MaVanDon).toBe('VN987654321');
            expect(mockHarvestRepo.updateHarvest).toHaveBeenCalledWith('TH001', expect.objectContaining({
                TrangThaiDongGoi: 'STORAGE_COOL',
                TrangThaiGiaoHang: 'DELIVERING',
                DiaChiGiaoHang: '456 Đường Nguyễn Trãi, Quận 5',
                MaVanDon: 'VN987654321',
                GhiChu: 'Bảo quản nhiệt độ 5 độ C',
            }));
        });

        test('FARMER marks delivery as DELIVERED (200)', async () => {
            mockHarvestRepo.getHarvestById.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiGiaoHang: 'DELIVERING',
            });
            mockHarvestRepo.updateHarvest.mockResolvedValueOnce({
                MaThuHoach: 'TH001',
                TrangThaiGiaoHang: 'DELIVERED',
            });

            const res = await request(app)
                .patch('/api/v1/harvests/TH001/delivery')
                .set('Authorization', `Bearer ${farmerToken}`)
                .send({
                    trangThaiGiaoHang: 'DELIVERED',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.TrangThaiGiaoHang).toBe('DELIVERED');
        });
    });
});
