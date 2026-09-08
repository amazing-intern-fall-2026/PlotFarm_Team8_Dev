// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import * as authRepo from '../repositories/authRepository.js';

/** Register a new customer and linked account inside a transaction */
export const registerUser = async (payload) => {
  const { fullName, email, phone, shippingAddress, username, password } = payload;
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    // Check duplicate username
    const existing = await authRepo.findAccountByUsername(username);
    if (existing) throw new AppError('Username already exists', 409);
    // Create customer
    const customerId = await authRepo.createCustomer({
      fullName,
      email,
      phone,
      shippingAddress,
    });
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // Create account (role CUSTOMER)
    await authRepo.createAccountForCustomer({
      username,
      passwordHash,
      role: 'CUSTOMER',
      maKH: customerId,
    });
    await transaction.commit();
    return { account: { username }, customer: { id: customerId, fullName, email } };
  } catch (err) {
    await transaction.rollback();
    if (err instanceof sql.RequestError && err.number === 2627) {
      throw new AppError('Email already exists', 409);
    }
    throw err;
  }
};

/** Login user */
export const loginUser = async ({ username, password }) => {
  const account = await authRepo.findAccountByUsername(username);
  if (!account) throw new AppError('Invalid credentials', 401);
  const match = await bcrypt.compare(password, account.MatKhauHash);
  if (!match) throw new AppError('Invalid credentials', 401);

  // Fetch profile
  const userInfo = await getUserInfoByAccount(account);
  const payload = {
    accountId: account.TenDangNhap,
    userId: userInfo.id,
    userType: userInfo.type,
    role: account.MaVaiTro,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
  return {
    accessToken: token,
    user: {
      id: userInfo.id,
      accountId: account.TenDangNhap,
      fullName: userInfo.fullName,
      email: userInfo.email,
      userType: userInfo.type,
      role: account.MaVaiTro,
    },
  };
};

/** Helper to get user profile from account */
const getUserInfoByAccount = async (account) => {
  if (account.MaKH) {
    const cust = await authRepo.getCustomerById(account.MaKH);
    return { id: cust.id, fullName: cust.fullName, email: cust.email, type: 'CUSTOMER' };
  }
  const emp = await authRepo.getEmployeeById(account.MaNV);
  return { id: emp.id, fullName: emp.fullName, email: emp.email, type: 'EMPLOYEE' };
};

/** Get current user based on JWT payload */
export const getCurrentUser = async (payload) => {
  const { userId, userType } = payload;
  if (userType === 'CUSTOMER') {
    const cust = await authRepo.getCustomerById(userId);
    return { ...cust, userType, role: payload.role };
  }
  const emp = await authRepo.getEmployeeById(userId);
  return { ...emp, userType, role: payload.role };
};
