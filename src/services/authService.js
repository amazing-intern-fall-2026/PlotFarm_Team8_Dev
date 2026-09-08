import { hashPassword, comparePassword } from '../utils/passwordHelper.js';
import { generateTokens } from '../utils/jwtHelper.js';
import * as authRepository from '../repositories/authRepository.js';

/**
 * Register a new customer
 */
export const register = async (userData) => {
  const { TenKH, Email, DienThoai, DiaChi, MatKhau } = userData;

  // 1. Check if email already exists
  const emailExists = await authRepository.checkEmailExists(Email);
  if (emailExists) {
    throw new Error('Email đã được sử dụng.');
  }

  // 2. Check if username (Email) already exists in accounts
  const accountExists = await authRepository.findAccountByUsername(Email);
  if (accountExists) {
    throw new Error('Tên đăng nhập đã tồn tại.');
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(MatKhau);

  // 4. Generate Customer ID
  const MaKH = 'KH' + Date.now().toString().slice(-10); // Simple ID generation

  // 5. Prepare data
  const customerData = {
    MaKH,
    TenKH,
    Email,
    DienThoai,
    DiaChi,
    TrangThai: 'ACTIVE'
  };

  const accountData = {
    TenDangNhap: Email, // Use Email as username for Customers
    MatKhauHash: hashedPassword,
    MaVaiTro: 'CUSTOMER', // Default role for registration
    MaKH: MaKH
  };

  // 6. Save to DB
  await authRepository.createCustomerAccount(customerData, accountData);

  return {
    TenDangNhap: accountData.TenDangNhap,
    TenKH: customerData.TenKH,
    Email: customerData.Email
  };
};

/**
 * Login a user
 */
export const login = async (username, password) => {
  // 1. Find user by username
  const account = await authRepository.findAccountByUsername(username);
  if (!account) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  // 2. Verify password
  const isMatch = await comparePassword(password, account.MatKhauHash);
  if (!isMatch) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  // 3. Generate tokens
  const payload = {
    username: account.TenDangNhap,
    role: account.MaVaiTro,
    MaKH: account.MaKH,
    MaNV: account.MaNV
  };
  
  const tokens = generateTokens(payload);

  return {
    user: payload,
    tokens
  };
};

/**
 * Get current user profile
 */
export const getMe = async (username) => {
  const profile = await authRepository.getUserProfile(username);
  if (!profile) {
    throw new Error('Không tìm thấy thông tin người dùng.');
  }
  return profile;
};
