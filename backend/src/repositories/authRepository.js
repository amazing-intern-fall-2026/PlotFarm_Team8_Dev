// src/repositories/authRepository.js
import sql from 'mssql';
import { getPool } from '../config/database.js';

import { generateIncrementalId } from '../utils/idGenerator.js';

/** Insert a new customer and return generated MaKH */
export const createCustomer = async ({ fullName, email, phone, shippingAddress }, transaction) => {
  const newMaKH = await generateIncrementalId(transaction || getPool(), 'KHACHHANG', 'MaKH', 'KH', 3);

  const insertRequest = new sql.Request(transaction || getPool());
  const query = `INSERT INTO dbo.KHACHHANG (MaKH, TenKH, Email, DienThoai, DiaChi, TrangThai)
                 OUTPUT INSERTED.MaKH
                 VALUES (@maKH, @fullName, @email, @phone, @address, 'ACTIVE')`;
  insertRequest.input('maKH', sql.VarChar, newMaKH);
  insertRequest.input('fullName', sql.NVarChar, fullName);
  insertRequest.input('email', sql.VarChar, email);
  insertRequest.input('phone', sql.VarChar, phone);
  insertRequest.input('address', sql.NVarChar, shippingAddress);
  const result = await insertRequest.query(query);
  return result.recordset[0].MaKH;
};

/** Insert a new account linked to a customer */
export const createAccountForCustomer = async ({ username, passwordHash, role, maKH }, transaction) => {
  const request = new sql.Request(transaction || getPool());
  const query = `INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
                 VALUES (@username, @hash, @role, @maKH)`;
  request.input('username', sql.VarChar, username);
  request.input('hash', sql.VarChar, passwordHash);
  request.input('role', sql.VarChar, role);
  request.input('maKH', sql.VarChar, maKH);
  await request.query(query);
};

/** Insert a new employee and return generated MaNV */
export const createEmployee = async ({ fullName, email, phone, role }, transaction) => {
  const newMaNV = await generateIncrementalId(transaction || getPool(), 'NHANVIEN', 'MaNV', 'NV', 3);

  const trimmedName = (fullName || '').trim();
  const parts = trimmedName.split(/\s+/);
  const ho = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const ten = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';

  const insertRequest = new sql.Request(transaction || getPool());
  const query = `INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
                 OUTPUT INSERTED.MaNV
                 VALUES (@maNV, @ho, @ten, @email, @phone, @role, 'ACTIVE')`;
  insertRequest.input('maNV', sql.VarChar, newMaNV);
  insertRequest.input('ho', sql.NVarChar, ho);
  insertRequest.input('ten', sql.NVarChar, ten);
  insertRequest.input('email', sql.VarChar, email);
  insertRequest.input('phone', sql.VarChar, phone);
  insertRequest.input('role', sql.VarChar, role);
  const result = await insertRequest.query(query);
  return result.recordset[0].MaNV;
};

/** Insert a new account linked to an employee */
export const createAccountForEmployee = async ({ username, passwordHash, role, maNV }, transaction) => {
  const request = new sql.Request(transaction || getPool());
  const query = `INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
                 VALUES (@username, @hash, @role, @maNV)`;
  request.input('username', sql.VarChar, username);
  request.input('hash', sql.VarChar, passwordHash);
  request.input('role', sql.VarChar, role);
  request.input('maNV', sql.VarChar, maNV);
  await request.query(query);
};

/** Find customer by email */
export const findCustomerByEmail = async (email, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('email', sql.VarChar, email);
  const result = await request.query(`SELECT * FROM dbo.KHACHHANG WHERE Email = @email`);
  return result.recordset[0];
};

/** Find customer by phone */
export const findCustomerByPhone = async (phone, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('phone', sql.VarChar, phone);
  const result = await request.query(`SELECT * FROM dbo.KHACHHANG WHERE DienThoai = @phone`);
  return result.recordset[0];
};

/** Find employee by email */
export const findEmployeeByEmail = async (email, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('email', sql.VarChar, email);
  const result = await request.query(`SELECT * FROM dbo.NHANVIEN WHERE Email = @email`);
  return result.recordset[0];
};

/** Find employee by phone */
export const findEmployeeByPhone = async (phone, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('phone', sql.VarChar, phone);
  const result = await request.query(`SELECT * FROM dbo.NHANVIEN WHERE DienThoai = @phone`);
  return result.recordset[0];
};

/** Find account by username */
export const findAccountByUsername = async (username, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('username', sql.VarChar, username);
  const result = await request.query(`SELECT * FROM dbo.TAIKHOAN WHERE TenDangNhap = @username`);
  return result.recordset[0];
};

/** Get customer profile with full contact info and account username */
export const getCustomerById = async (id, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('id', sql.VarChar, id);
  const result = await request.query(`
    SELECT 
      k.MaKH AS id, 
      k.TenKH AS fullName, 
      k.Email AS email,
      k.DienThoai AS phone,
      k.DiaChi AS shippingAddress,
      k.TrangThai AS status,
      t.TenDangNhap AS username,
      t.MaVaiTro AS role
    FROM dbo.KHACHHANG k
    LEFT JOIN dbo.TAIKHOAN t ON t.MaKH = k.MaKH
    WHERE k.MaKH = @id
  `);
  return result.recordset[0];
};

/** Get employee profile with full contact info and account username */
export const getEmployeeById = async (id, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('id', sql.VarChar, id);
  const result = await request.query(`
    SELECT 
      n.MaNV AS id, 
      LTRIM(RTRIM(CONCAT(n.Ho, ' ', n.Ten))) AS fullName, 
      n.Email AS email,
      n.DienThoai AS phone,
      n.ChucVu AS employeeRole,
      n.TrangThai AS status,
      t.TenDangNhap AS username,
      t.MaVaiTro AS role
    FROM dbo.NHANVIEN n
    LEFT JOIN dbo.TAIKHOAN t ON t.MaNV = n.MaNV
    WHERE n.MaNV = @id
  `);
  return result.recordset[0];
};

/** Update customer profile in database */
export const updateCustomerProfile = async (id, { fullName, phone, shippingAddress }, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('id', sql.VarChar, id);
  request.input('fullName', sql.NVarChar, fullName);
  request.input('phone', sql.VarChar, phone);
  request.input('shippingAddress', sql.NVarChar, shippingAddress);
  const query = `
    UPDATE dbo.KHACHHANG
    SET TenKH = @fullName,
        DienThoai = @phone,
        DiaChi = @shippingAddress,
        UpdatedAt = SYSUTCDATETIME()
    WHERE MaKH = @id
  `;
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};

/** Update employee profile in database */
export const updateEmployeeProfile = async (id, { fullName, phone }, transaction) => {
  const trimmedName = (fullName || '').trim();
  const parts = trimmedName.split(/\s+/);
  const ho = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const ten = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';

  const request = new sql.Request(transaction || getPool());
  request.input('id', sql.VarChar, id);
  request.input('ho', sql.NVarChar, ho);
  request.input('ten', sql.NVarChar, ten);
  request.input('phone', sql.VarChar, phone);
  const query = `
    UPDATE dbo.NHANVIEN
    SET Ho = @ho,
        Ten = @ten,
        DienThoai = @phone,
        UpdatedAt = SYSUTCDATETIME()
    WHERE MaNV = @id
  `;
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};

/** Find account and linked contact (email, fullName) by username or email */
export const findAccountWithContactByIdentifier = async (identifier, transaction) => {
  const trimmed = (identifier || '').trim();
  const pool = transaction || getPool();

  // 1. Try finding by username first
  const userReq = new sql.Request(pool);
  userReq.input('identifier', sql.VarChar, trimmed);
  const accountRes = await userReq.query(`SELECT * FROM dbo.TAIKHOAN WHERE TenDangNhap = @identifier`);
  const account = accountRes.recordset[0];

  if (account) {
    if (account.MaKH) {
      const cust = await getCustomerById(account.MaKH, transaction);
      return { username: account.TenDangNhap, email: cust?.email, fullName: cust?.fullName, role: account.MaVaiTro };
    }
    if (account.MaNV) {
      const emp = await getEmployeeById(account.MaNV, transaction);
      return { username: account.TenDangNhap, email: emp?.email, fullName: emp?.fullName, role: account.MaVaiTro };
    }
  }

  // 2. Try finding by customer email
  const custByEmail = await findCustomerByEmail(trimmed, transaction);
  if (custByEmail) {
    const accReq = new sql.Request(pool);
    accReq.input('maKH', sql.VarChar, custByEmail.MaKH);
    const accRes = await accReq.query(`SELECT * FROM dbo.TAIKHOAN WHERE MaKH = @maKH`);
    const linkedAcc = accRes.recordset[0];
    if (linkedAcc) {
      return { username: linkedAcc.TenDangNhap, email: custByEmail.Email, fullName: custByEmail.TenKH, role: linkedAcc.MaVaiTro };
    }
  }

  // 3. Try finding by employee email
  const empByEmail = await findEmployeeByEmail(trimmed, transaction);
  if (empByEmail) {
    const accReq = new sql.Request(pool);
    accReq.input('maNV', sql.VarChar, empByEmail.MaNV);
    const accRes = await accReq.query(`SELECT * FROM dbo.TAIKHOAN WHERE MaNV = @maNV`);
    const linkedAcc = accRes.recordset[0];
    if (linkedAcc) {
      return {
        username: linkedAcc.TenDangNhap,
        email: empByEmail.Email,
        fullName: `${empByEmail.Ho || ''} ${empByEmail.Ten || ''}`.trim(),
        role: linkedAcc.MaVaiTro,
      };
    }
  }

  return null;
};

/** Create a password reset OTP record */
export const createPasswordResetRecord = async ({ username, email, otpHash, expiresAt }, transaction) => {
  const request = new sql.Request(transaction || getPool());
  const query = `
    INSERT INTO dbo.DATLAIMATKHAU (TenDangNhap, Email, OtpHash, ExpiresAt, IsUsed)
    OUTPUT INSERTED.Id
    VALUES (@username, @email, @otpHash, @expiresAt, 0)
  `;
  request.input('username', sql.VarChar, username);
  request.input('email', sql.VarChar, email);
  request.input('otpHash', sql.VarChar, otpHash);
  request.input('expiresAt', sql.DateTime2, expiresAt);
  const result = await request.query(query);
  return result.recordset[0].Id;
};

/** Find latest valid (unused, unexpired) OTP record for username */
export const findLatestValidResetOtp = async (username, transaction) => {
  const request = new sql.Request(transaction || getPool());
  const query = `
    SELECT TOP 1 * FROM dbo.DATLAIMATKHAU
    WHERE TenDangNhap = @username AND IsUsed = 0 AND ExpiresAt > SYSUTCDATETIME()
    ORDER BY CreatedAt DESC
  `;
  request.input('username', sql.VarChar, username);
  const result = await request.query(query);
  return result.recordset[0] || null;
};

/** Invalidate (cancel) all unused OTPs for a username when requesting a new one */
export const invalidateActiveOtpsByUsername = async (username, transaction) => {
  const request = new sql.Request(transaction || getPool());
  await request
    .input('username', sql.VarChar, username)
    .query(`UPDATE dbo.DATLAIMATKHAU SET IsUsed = 1 WHERE TenDangNhap = @username AND IsUsed = 0`);
};

/** Mark OTP record as used */
export const markOtpAsUsed = async (id, transaction) => {
  const request = new sql.Request(transaction || getPool());
  await request.input('id', sql.BigInt, id).query(`UPDATE dbo.DATLAIMATKHAU SET IsUsed = 1 WHERE Id = @id`);
};

/** Update account password hash */
export const updateAccountPassword = async (username, newPasswordHash, transaction) => {
  const request = new sql.Request(transaction || getPool());
  const result = await request
    .input('username', sql.VarChar, username)
    .input('hash', sql.VarChar, newPasswordHash)
    .query(`UPDATE dbo.TAIKHOAN SET MatKhauHash = @hash WHERE TenDangNhap = @username`);
  return result.rowsAffected[0] > 0;
};

