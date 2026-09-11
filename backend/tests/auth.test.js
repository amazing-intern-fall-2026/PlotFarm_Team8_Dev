import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/config.js';

const mockTransaction = {
  begin: jest.fn().mockResolvedValue(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
};

const mockAuthRepo = {
  findAccountByUsername: jest.fn(),
  findCustomerByEmail: jest.fn(),
  findCustomerByPhone: jest.fn(),
  findEmployeeByEmail: jest.fn(),
  findEmployeeByPhone: jest.fn(),
  createCustomer: jest.fn(),
  createAccountForCustomer: jest.fn(),
  createEmployee: jest.fn(),
  createAccountForEmployee: jest.fn(),
  getCustomerById: jest.fn(),
  getEmployeeById: jest.fn(),
};

jest.unstable_mockModule('../src/repositories/authRepository.js', () => mockAuthRepo);
jest.unstable_mockModule('../src/utils/transactionHelper.js', () => ({
  runInTransaction: jest.fn(async (cb) => {
    return await cb(mockTransaction);
  }),
}));

const authService = await import('../src/services/authService.js');
const { validateRegister, validateRegisterEmployee, validateLogin } = await import(
  '../src/validators/authValidator.js'
);

describe('Authentication Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validator Tests', () => {
    const runValidation = async (validatorArray, body) => {
      const req = { body };
      let resultStatus = null;
      let resultBody = null;
      let nextCalled = false;

      const res = {
        status(code) {
          resultStatus = code;
          return this;
        },
        json(data) {
          resultBody = data;
          return this;
        },
      };

      for (const middleware of validatorArray) {
        let called = false;
        await middleware(req, res, () => {
          called = true;
        });
        if (!called) {
          // Stopped early by handleValidation
          return { status: resultStatus, body: resultBody, nextCalled: false };
        }
      }
      return { status: 200, nextCalled: true };
    };

    test('validateRegister should fail if required fields are invalid or missing', async () => {
      const invalidData = {
        fullName: '',
        email: 'not-an-email',
        phone: '123',
        shippingAddress: '',
        username: 'ab', // < 3 chars
        password: '123', // < 8 chars
      };

      const res = await runValidation(validateRegister, invalidData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(5);
    });

    test('validateRegister should reject email exceeding 254 chars (DB column length limit)', async () => {
      const longEmail = 'a'.repeat(246) + '@farm.com'; // 255 chars
      const invalidData = {
        fullName: 'Nguyen Van A',
        email: longEmail,
        phone: '0912345678',
        shippingAddress: '123 Street',
        username: 'user01',
        password: 'Password123',
      };

      const res = await runValidation(validateRegister, invalidData);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Email cannot exceed 254 characters' }),
        ])
      );
    });

    test('validateRegister should reject fullName exceeding 255 chars (DB column length limit)', async () => {
      const invalidData = {
        fullName: 'a'.repeat(256),
        email: 'user@farm.com',
        phone: '0912345678',
        shippingAddress: '123 Street',
        username: 'user01',
        password: 'Password123',
      };

      const res = await runValidation(validateRegister, invalidData);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Full name cannot exceed 255 characters' }),
        ])
      );
    });

    test('validateRegisterEmployee should reject invalid role', async () => {
      const invalidEmployee = {
        fullName: 'Nguyen Van A',
        email: 'employee@farm.com',
        phone: '0987654321',
        username: 'staff01',
        password: 'password123',
        role: 'CUSTOMER', // not ADMIN or FARMER
      };

      const res = await runValidation(validateRegisterEmployee, invalidEmployee);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Role must be ADMIN or FARMER' }),
        ])
      );
    });

    test('validateRegisterEmployee should pass for valid ADMIN or FARMER payload', async () => {
      const validEmployee = {
        fullName: 'Nguyen Van A',
        email: 'employee@farm.com',
        phone: '0987654321',
        username: 'staff01',
        password: 'password123',
        role: 'FARMER',
      };

      const res = await runValidation(validateRegisterEmployee, validEmployee);
      expect(res.nextCalled).toBe(true);
    });
  });

  describe('registerUser Service', () => {
    const validUserPayload = {
      fullName: 'Tran Van Khach',
      email: 'khach@gmail.com',
      phone: '0912345678',
      shippingAddress: '123 Đường Nông Nghiệp, HCM',
      username: 'khachhang01',
      password: 'SecurePassword123',
    };

    test('should reject if username already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce({ TenDangNhap: 'khachhang01' });

      await expect(authService.registerUser(validUserPayload)).rejects.toThrow(
        'Username already exists'
      );
      expect(mockAuthRepo.findAccountByUsername).toHaveBeenCalledWith('khachhang01', mockTransaction);
      expect(mockAuthRepo.createCustomer).not.toHaveBeenCalled();
    });

    test('should reject if email already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findCustomerByEmail.mockResolvedValueOnce({ Email: 'khach@gmail.com' });

      await expect(authService.registerUser(validUserPayload)).rejects.toThrow(
        'Email already exists'
      );
      expect(mockAuthRepo.findCustomerByEmail).toHaveBeenCalledWith('khach@gmail.com', mockTransaction);
      expect(mockAuthRepo.createCustomer).not.toHaveBeenCalled();
    });

    test('should reject if phone number already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findCustomerByEmail.mockResolvedValueOnce(null);
      mockAuthRepo.findCustomerByPhone.mockResolvedValueOnce({ DienThoai: '0912345678' });

      await expect(authService.registerUser(validUserPayload)).rejects.toThrow(
        'Phone number already exists'
      );
      expect(mockAuthRepo.findCustomerByPhone).toHaveBeenCalledWith('0912345678', mockTransaction);
      expect(mockAuthRepo.createCustomer).not.toHaveBeenCalled();
    });

    test('should successfully register user, hash password, and link customer to account', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findCustomerByEmail.mockResolvedValueOnce(null);
      mockAuthRepo.findCustomerByPhone.mockResolvedValueOnce(null);
      mockAuthRepo.createCustomer.mockResolvedValueOnce('KH001');
      mockAuthRepo.createAccountForCustomer.mockResolvedValueOnce();

      const result = await authService.registerUser(validUserPayload);

      expect(mockAuthRepo.createCustomer).toHaveBeenCalledWith(
        {
          fullName: 'Tran Van Khach',
          email: 'khach@gmail.com',
          phone: '0912345678',
          shippingAddress: '123 Đường Nông Nghiệp, HCM',
        },
        mockTransaction
      );

      expect(mockAuthRepo.createAccountForCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'khachhang01',
          role: 'CUSTOMER',
          maKH: 'KH001',
          passwordHash: expect.any(String),
        }),
        mockTransaction
      );

      // Verify password hash matches original password
      const passedHash = mockAuthRepo.createAccountForCustomer.mock.calls[0][0].passwordHash;
      expect(await bcrypt.compare(validUserPayload.password, passedHash)).toBe(true);

      expect(result).toEqual({
        account: { username: 'khachhang01' },
        customer: { id: 'KH001', fullName: 'Tran Van Khach', email: 'khach@gmail.com' },
      });
    });
  });

  describe('registerEmployee Service', () => {
    const validEmpPayload = {
      fullName: 'Le Quan Ly',
      email: 'quanly@farm.com',
      phone: '0933333333',
      username: 'quanly01',
      password: 'AdminPassword123',
      role: 'ADMIN',
    };

    test('should reject if username already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce({ TenDangNhap: 'quanly01' });

      await expect(authService.registerEmployee(validEmpPayload)).rejects.toThrow(
        'Username already exists'
      );
    });

    test('should reject if employee email already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findEmployeeByEmail.mockResolvedValueOnce({ Email: 'quanly@farm.com' });

      await expect(authService.registerEmployee(validEmpPayload)).rejects.toThrow(
        'Email already exists'
      );
      expect(mockAuthRepo.findEmployeeByEmail).toHaveBeenCalledWith('quanly@farm.com', mockTransaction);
    });

    test('should reject if employee phone already exists', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findEmployeeByEmail.mockResolvedValueOnce(null);
      mockAuthRepo.findEmployeeByPhone.mockResolvedValueOnce({ DienThoai: '0933333333' });

      await expect(authService.registerEmployee(validEmpPayload)).rejects.toThrow(
        'Phone number already exists'
      );
      expect(mockAuthRepo.findEmployeeByPhone).toHaveBeenCalledWith('0933333333', mockTransaction);
    });

    test('should successfully register employee and link account', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);
      mockAuthRepo.findEmployeeByEmail.mockResolvedValueOnce(null);
      mockAuthRepo.findEmployeeByPhone.mockResolvedValueOnce(null);
      mockAuthRepo.createEmployee.mockResolvedValueOnce('NV001');
      mockAuthRepo.createAccountForEmployee.mockResolvedValueOnce();

      const result = await authService.registerEmployee(validEmpPayload);

      expect(mockAuthRepo.createEmployee).toHaveBeenCalledWith(
        {
          fullName: 'Le Quan Ly',
          email: 'quanly@farm.com',
          phone: '0933333333',
          role: 'ADMIN',
        },
        mockTransaction
      );

      expect(result).toEqual({
        account: { username: 'quanly01', role: 'ADMIN' },
        employee: { id: 'NV001', fullName: 'Le Quan Ly', email: 'quanly@farm.com' },
      });
    });
  });

  describe('loginUser Service', () => {
    test('should reject non-existent username with 401', async () => {
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce(null);

      await expect(
        authService.loginUser({ username: 'nonexistent', password: 'password' })
      ).rejects.toThrow('Invalid credentials');
    });

    test('should reject incorrect password with 401', async () => {
      const hash = await bcrypt.hash('correctPassword', 10);
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce({
        TenDangNhap: 'user01',
        MatKhauHash: hash,
      });

      await expect(
        authService.loginUser({ username: 'user01', password: 'wrongPassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    test('should return JWT token and omit password on successful login', async () => {
      const plainPassword = 'correctPassword';
      const hash = await bcrypt.hash(plainPassword, 10);
      mockAuthRepo.findAccountByUsername.mockResolvedValueOnce({
        TenDangNhap: 'khach01',
        MatKhauHash: hash,
        MaVaiTro: 'CUSTOMER',
        MaKH: 'KH001',
      });
      mockAuthRepo.getCustomerById.mockResolvedValueOnce({
        id: 'KH001',
        fullName: 'Tran Van Khach',
        email: 'khach@gmail.com',
      });

      const response = await authService.loginUser({
        username: 'khach01',
        password: plainPassword,
      });

      expect(response).toHaveProperty('accessToken');
      expect(response.user).toEqual({
        id: 'KH001',
        accountId: 'khach01',
        fullName: 'Tran Van Khach',
        email: 'khach@gmail.com',
        userType: 'CUSTOMER',
        role: 'CUSTOMER',
      });
      expect(response).not.toHaveProperty('password');
      expect(response).not.toHaveProperty('MatKhauHash');

      // Verify token is valid and decodable
      const decoded = jwt.verify(response.accessToken, JWT_SECRET);
      expect(decoded.userId).toBe('KH001');
      expect(decoded.role).toBe('CUSTOMER');
    });
  });

  describe('getCurrentUser Service', () => {
    test('should return customer profile for CUSTOMER type', async () => {
      mockAuthRepo.getCustomerById.mockResolvedValueOnce({
        id: 'KH001',
        fullName: 'Tran Van Khach',
        email: 'khach@gmail.com',
      });

      const profile = await authService.getCurrentUser({
        userId: 'KH001',
        userType: 'CUSTOMER',
        role: 'CUSTOMER',
      });

      expect(profile).toEqual({
        id: 'KH001',
        fullName: 'Tran Van Khach',
        email: 'khach@gmail.com',
        userType: 'CUSTOMER',
        role: 'CUSTOMER',
      });
    });

    test('should return employee profile for EMPLOYEE type', async () => {
      mockAuthRepo.getEmployeeById.mockResolvedValueOnce({
        id: 'NV001',
        fullName: 'Le Quan Ly',
        email: 'quanly@farm.com',
      });

      const profile = await authService.getCurrentUser({
        userId: 'NV001',
        userType: 'EMPLOYEE',
        role: 'ADMIN',
      });

      expect(profile).toEqual({
        id: 'NV001',
        fullName: 'Le Quan Ly',
        email: 'quanly@farm.com',
        userType: 'EMPLOYEE',
        role: 'ADMIN',
      });
    });
  });
});
