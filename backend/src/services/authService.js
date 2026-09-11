// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';
import sql from 'mssql';
import { AppError } from '../utils/AppError.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import * as authRepo from '../repositories/authRepository.js';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from '../config/config.js';

/** Register a new customer and linked account inside a transaction */
export const registerUser = async (payload) => {
  const { fullName, email, phone, shippingAddress, username, password } = payload;
  
  return runInTransaction(async (transaction) => {
    // Check duplicate username inside transaction
    const existingUsername = await authRepo.findAccountByUsername(username, transaction);
    if (existingUsername) throw new AppError('Username already exists', 409);

    // Check duplicate email inside transaction
    const existingEmail = await authRepo.findCustomerByEmail(email, transaction);
    if (existingEmail) throw new AppError('Email already exists', 409);

    // Check duplicate phone inside transaction
    const existingPhone = await authRepo.findCustomerByPhone(phone, transaction);
    if (existingPhone) throw new AppError('Phone number already exists', 409);

    // Create customer inside transaction
    const customerId = await authRepo.createCustomer({
      fullName,
      email,
      phone,
      shippingAddress,
    }, transaction);

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create account (role CUSTOMER) inside transaction
    await authRepo.createAccountForCustomer({
      username,
      passwordHash,
      role: 'CUSTOMER',
      maKH: customerId,
    }, transaction);

    return { account: { username }, customer: { id: customerId, fullName, email } };
  });
};

/** Register a new employee (Farmer/Admin) inside a transaction */
export const registerEmployee = async (payload) => {
  const { fullName, email, phone, username, password, role } = payload;
  
  return runInTransaction(async (transaction) => {
    // Check duplicate username inside transaction
    const existingUsername = await authRepo.findAccountByUsername(username, transaction);
    if (existingUsername) throw new AppError('Username already exists', 409);

    // Check duplicate email inside transaction
    const existingEmail = await authRepo.findEmployeeByEmail(email, transaction);
    if (existingEmail) throw new AppError('Email already exists', 409);

    // Check duplicate phone inside transaction
    const existingPhone = await authRepo.findEmployeeByPhone(phone, transaction);
    if (existingPhone) throw new AppError('Phone number already exists', 409);

    // Create employee inside transaction
    const employeeId = await authRepo.createEmployee({
      fullName,
      email,
      phone,
      role
    }, transaction);

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create account inside transaction
    await authRepo.createAccountForEmployee({
      username,
      passwordHash,
      role: role,
      maNV: employeeId,
    }, transaction);

    return { account: { username, role }, employee: { id: employeeId, fullName, email } };
  });
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
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
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
    if (!cust) return null;
    return { ...cust, userType, role: payload.role };
  }
  const emp = await authRepo.getEmployeeById(userId);
  if (!emp) return null;
  return { ...emp, userType, role: payload.role };
};
