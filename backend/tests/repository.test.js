import { jest } from '@jest/globals';

const mockInputs = {};
const mockQuery = jest.fn();

const mockRequestInstance = {
  input: jest.fn((name, type, val) => {
    mockInputs[name] = { type, val };
    return mockRequestInstance;
  }),
  query: mockQuery,
};

const MockRequestClass = jest.fn(function () {
  return mockRequestInstance;
});

const mockPool = {};

jest.unstable_mockModule('mssql', () => ({
  default: {
    Request: MockRequestClass,
    VarChar: 'VarChar',
    NVarChar: 'NVarChar',
  },
  VarChar: 'VarChar',
  NVarChar: 'NVarChar',
}));

jest.unstable_mockModule('../src/config/database.js', () => ({
  getPool: jest.fn(() => mockPool),
}));

jest.unstable_mockModule('../src/utils/idGenerator.js', () => ({
  generateIncrementalId: jest.fn().mockResolvedValue('NV001'),
}));

const authRepo = await import('../src/repositories/authRepository.js');

describe('Auth Repository Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockInputs)) {
      delete mockInputs[key];
    }
  });

  test('createEmployee should correctly separate fullName into Ho and Ten', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ MaNV: 'NV001' }] });

    const empId = await authRepo.createEmployee({
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@farm.com',
      phone: '0987654321',
      role: 'FARMER',
    });

    expect(empId).toBe('NV001');
    expect(mockInputs.ho.val).toBe('Nguyen Van');
    expect(mockInputs.ten.val).toBe('An');
    expect(mockInputs.email.val).toBe('an.nguyen@farm.com');
    expect(mockInputs.phone.val).toBe('0987654321');
    expect(mockInputs.role.val).toBe('FARMER');
  });

  test('createEmployee should handle single-word fullName', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ MaNV: 'NV002' }] });

    await authRepo.createEmployee({
      fullName: 'An',
      email: 'an@farm.com',
      phone: '0912345678',
      role: 'ADMIN',
    });

    expect(mockInputs.ho.val).toBe('');
    expect(mockInputs.ten.val).toBe('An');
  });

  test('createEmployee should use provided transaction request', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ MaNV: 'NV003' }] });
    const mockTx = { isTx: true };

    await authRepo.createEmployee(
      {
        fullName: 'Tran Thi B',
        email: 'b@farm.com',
        phone: '0900000000',
        role: 'FARMER',
      },
      mockTx
    );

    expect(MockRequestClass).toHaveBeenCalledWith(mockTx);
  });

  test('findCustomerByPhone should parameterize phone query and return record', async () => {
    const expectedCustomer = { MaKH: 'KH001', TenKH: 'Test', DienThoai: '0912345678' };
    mockQuery.mockResolvedValueOnce({ recordset: [expectedCustomer] });

    const result = await authRepo.findCustomerByPhone('0912345678');

    expect(mockInputs.phone.val).toBe('0912345678');
    expect(result).toEqual(expectedCustomer);
  });

  test('findEmployeeByEmail should parameterize email query and return record', async () => {
    const expectedEmployee = { MaNV: 'NV001', Email: 'test@farm.com' };
    mockQuery.mockResolvedValueOnce({ recordset: [expectedEmployee] });

    const result = await authRepo.findEmployeeByEmail('test@farm.com');

    expect(mockInputs.email.val).toBe('test@farm.com');
    expect(result).toEqual(expectedEmployee);
  });

  test('should propagate MSSQL foreign key violation error (error 547)', async () => {
    const fkError = new Error('The INSERT statement conflicted with the FOREIGN KEY constraint FK_TAIKHOAN_VAITRO');
    fkError.number = 547;
    mockQuery.mockRejectedValueOnce(fkError);

    await expect(
      authRepo.createAccountForCustomer({
        username: 'user_invalid_role',
        passwordHash: 'hashed',
        role: 'NON_EXISTENT_ROLE',
        maKH: 'KH001',
      })
    ).rejects.toThrow('The INSERT statement conflicted with the FOREIGN KEY constraint');
  });
});
