import request from 'supertest';
import { jest } from '@jest/globals';

const mockPool = {
    request: jest.fn(() => ({
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    })),
};

jest.unstable_mockModule('../src/config/database.js', () => ({
    getPool: jest.fn(() => mockPool),
    connectDatabase: jest.fn(),
    closeDatabase: jest.fn(),
}));

const { default: app } = await import('../src/app.js');

describe('Task 11 — Backend Route Integration Test Suite', () => {
    const routePrefixes = [
        { path: '/api/v1/auth/me', method: 'get', expectedNotStatus: 404, label: '/api/v1/auth' },
        { path: '/api/v1/farms', method: 'get', expectedNotStatus: 404, label: '/api/v1/farms' },
        { path: '/api/v1/plots', method: 'get', expectedNotStatus: 404, label: '/api/v1/plots' },
        { path: '/api/v1/crops', method: 'get', expectedNotStatus: 404, label: '/api/v1/crops' },
        { path: '/api/v1/contracts', method: 'get', expectedNotStatus: 404, label: '/api/v1/contracts' },
        { path: '/api/v1/farming-logs', method: 'get', expectedNotStatus: 404, label: '/api/v1/farming-logs' },
        { path: '/api/v1/care-requests', method: 'get', expectedNotStatus: 404, label: '/api/v1/care-requests' },
        { path: '/api/v1/harvests', method: 'get', expectedNotStatus: 404, label: '/api/v1/harvests' },
        { path: '/api/v1/admin/kpi', method: 'get', expectedNotStatus: 404, label: '/api/v1/admin' },
    ];

    test.each(routePrefixes)(
        'Route group $label is registered in app.js and does not 404',
        async ({ path, expectedNotStatus }) => {
            const res = await request(app).get(path);
            expect(res.status).not.toBe(expectedNotStatus);
        }
    );

    test('Non-existent route returns 404 Not Found', async () => {
        const res = await request(app).get('/api/v1/non-existent-route-xyz');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
