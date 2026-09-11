import { jest } from '@jest/globals';

const mockRequest = {
  query: jest.fn(),
};
const mockPool = {
  request: jest.fn(() => mockRequest),
};

jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
  connectDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

const { health } = await import('../src/controllers/healthController.js');

describe('Health Check Test Suite', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json: jest.fn(function (data) {
        this.body = data;
        return this;
      }),
    };
    next = jest.fn();
  });

  test('should return 200 and database connected when query succeeds', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ healthCheck: 1 }] });

    await health(req, res, next);

    expect(mockRequest.query).toHaveBeenCalledWith('SELECT 1 AS healthCheck');
    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'OK',
        data: expect.objectContaining({
          database: 'connected',
        }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should forward error to next() when database query fails', async () => {
    const dbError = new Error('Database connection timeout');
    mockRequest.query.mockRejectedValueOnce(dbError);

    await health(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.json).not.toHaveBeenCalled();
  });
});
