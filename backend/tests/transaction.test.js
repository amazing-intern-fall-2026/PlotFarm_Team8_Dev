import { jest } from '@jest/globals';

const mockTransaction = {
  begin: jest.fn().mockResolvedValue(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
};

const MockTransactionClass = jest.fn(function () {
  return mockTransaction;
});

const mockPool = {};

jest.unstable_mockModule('mssql', () => ({
  default: {
    Transaction: MockTransactionClass,
    Request: jest.fn(),
  },
  Transaction: MockTransactionClass,
}));

jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
}));

const { runInTransaction } = await import('../src/utils/transactionHelper.js');

describe('Transaction Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should begin, execute callback, and commit transaction on success', async () => {
    const callbackResult = { success: true, id: 'KH001' };
    const mockCallback = jest.fn().mockResolvedValue(callbackResult);

    const result = await runInTransaction(mockCallback);

    expect(MockTransactionClass).toHaveBeenCalledWith(mockPool);
    expect(mockTransaction.begin).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(mockTransaction);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(result).toEqual(callbackResult);
  });

  test('should rollback transaction and rethrow error when callback throws', async () => {
    const errorToThrow = new Error('Insert failed due to constraint violation');
    const mockCallback = jest.fn().mockRejectedValue(errorToThrow);

    await expect(runInTransaction(mockCallback)).rejects.toThrow(
      'Insert failed due to constraint violation'
    );

    expect(mockTransaction.begin).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(mockTransaction);
    expect(mockTransaction.commit).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test('should safely handle rollback errors without masking original error', async () => {
    const originalError = new Error('Original business error');
    mockTransaction.rollback.mockRejectedValueOnce(new Error('Rollback failed'));

    const mockCallback = jest.fn().mockRejectedValue(originalError);

    await expect(runInTransaction(mockCallback)).rejects.toThrow(
      'Original business error'
    );

    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });
});
