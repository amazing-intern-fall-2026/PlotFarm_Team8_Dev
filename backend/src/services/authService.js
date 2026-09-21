import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';
import sql from 'mssql';
import { AppError } from '../utils/AppError.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import * as authRepo from '../repositories/authRepository.js';
import * as emailService from './emailService.js';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS, OTP_EXPIRES_MINUTES } from '../config/config.js';

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
      username: account.TenDangNhap,
      fullName: userInfo.fullName,
      email: userInfo.email,
      phone: userInfo.phone || '',
      shippingAddress: userInfo.shippingAddress || '',
      userType: userInfo.type,
      role: account.MaVaiTro,
    },
  };
};

/** Helper to get user profile from account */
const getUserInfoByAccount = async (account) => {
  if (account.MaKH) {
    const cust = await authRepo.getCustomerById(account.MaKH);
    return {
      id: cust.id,
      fullName: cust.fullName,
      email: cust.email,
      phone: cust.phone || '',
      shippingAddress: cust.shippingAddress || '',
      type: 'CUSTOMER',
    };
  }
  const emp = await authRepo.getEmployeeById(account.MaNV);
  return {
    id: emp.id,
    fullName: emp.fullName,
    email: emp.email,
    phone: emp.phone || '',
    type: 'EMPLOYEE',
  };
};

/** Get current user based on JWT payload */
export const getCurrentUser = async (payload) => {
  const { userId, userType, accountId } = payload;
  if (userType === 'CUSTOMER') {
    const cust = await authRepo.getCustomerById(userId);
    if (!cust) return null;
    return {
      ...cust,
      username: cust.username || accountId,
      userType,
      role: payload.role,
    };
  }
  const emp = await authRepo.getEmployeeById(userId);
  if (!emp) return null;
  return {
    ...emp,
    username: emp.username || accountId,
    userType,
    role: payload.role,
  };
};

/** Update current user's profile */
export const updateUserProfile = async (payload, authUser) => {
  const { fullName, phone, shippingAddress } = payload;
  const { userId, userType } = authUser;

  if (userType === 'CUSTOMER') {
    const success = await authRepo.updateCustomerProfile(userId, {
      fullName: (fullName || '').trim(),
      phone: (phone || '').trim(),
      shippingAddress: (shippingAddress || '').trim(),
    });
    if (!success) {
      throw new AppError('Không thể cập nhật hồ sơ khách hàng. Vui lòng thử lại sau.', 500);
    }
  } else {
    // EMPLOYEE (ADMIN, FARMER)
    const success = await authRepo.updateEmployeeProfile(userId, {
      fullName: (fullName || '').trim(),
      phone: (phone || '').trim(),
    });
    if (!success) {
      throw new AppError('Không thể cập nhật hồ sơ nhân viên. Vui lòng thử lại sau.', 500);
    }
  }

  // Fetch updated user
  const updatedUser = await getCurrentUser(authUser);
  return updatedUser;
};

/** Change password for logged-in user */
export const changeUserPassword = async ({ oldPassword, newPassword }, authUser) => {
  const username = authUser.accountId;
  const account = await authRepo.findAccountByUsername(username);
  if (!account) {
    throw new AppError('Tài khoản không tồn tại', 404);
  }

  const isMatch = await bcrypt.compare(oldPassword, account.MatKhauHash);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không chính xác', 400);
  }

  if (oldPassword === newPassword) {
    throw new AppError('Mật khẩu mới không được trùng với mật khẩu hiện tại', 400);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const updated = await authRepo.updateAccountPassword(username, newPasswordHash);
  if (!updated) {
    throw new AppError('Không thể đổi mật khẩu. Vui lòng thử lại sau.', 500);
  }

  return { message: 'Đổi mật khẩu thành công!' };
};

/** Helper to mask email for privacy display */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
};

/**
 * Request password reset — generate OTP via crypto, invalidate old OTPs, store hash, send email
 */
export const requestPasswordReset = async (identifier) => {
  const accountInfo = await authRepo.findAccountWithContactByIdentifier(identifier);
  if (!accountInfo) throw new AppError('Không tìm thấy tài khoản hoặc email trong hệ thống', 404);
  if (!accountInfo.email) throw new AppError('Tài khoản này chưa được cấu hình email liên hệ', 400);

  // Invalidate any previous unused OTPs for this user
  await authRepo.invalidateActiveOtpsByUsername(accountInfo.username);

  // Generate a cryptographically secure 6-digit OTP
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otpCode, BCRYPT_SALT_ROUNDS);

  // Expiration time (default 5 minutes)
  const expiresInMinutes = OTP_EXPIRES_MINUTES || 5;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Store hashed OTP in database
  await authRepo.createPasswordResetRecord({
    username: accountInfo.username,
    email: accountInfo.email,
    otpHash,
    expiresAt,
  });

  // Send real email via Gmail SMTP (throws error if SMTP fails)
  await emailService.sendPasswordResetOtpEmail(
    accountInfo.email,
    otpCode,
    accountInfo.username,
    expiresInMinutes
  );

  return {
    username: accountInfo.username,
    emailMasked: maskEmail(accountInfo.email),
    expiresInMinutes,
  };
};

/**
 * Reset password using OTP — verify, update password, invalidate OTP
 */
export const resetPassword = async ({ identifier, otp, newPassword }) => {
  const accountInfo = await authRepo.findAccountWithContactByIdentifier(identifier);
  if (!accountInfo) throw new AppError('Tài khoản không tồn tại', 404);

  const latestOtpRecord = await authRepo.findLatestValidResetOtp(accountInfo.username);
  if (!latestOtpRecord) throw new AppError('Mã xác thực OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.', 400);

  const isMatch = await bcrypt.compare(otp.trim(), latestOtpRecord.OtpHash);
  if (!isMatch) throw new AppError('Mã xác thực OTP không chính xác', 400);

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await runInTransaction(async (transaction) => {
    const updated = await authRepo.updateAccountPassword(accountInfo.username, newPasswordHash, transaction);
    if (!updated) throw new AppError('Không thể cập nhật mật khẩu. Vui lòng thử lại sau.', 500);
    await authRepo.markOtpAsUsed(latestOtpRecord.Id, transaction);
  });

  return {
    message: 'Đặt lại mật khẩu thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.',
    username: accountInfo.username,
  };
};
