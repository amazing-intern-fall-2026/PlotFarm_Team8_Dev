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

  const insertRequest = new sql.Request(transaction || getPool());
  const query = `INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
                 OUTPUT INSERTED.MaNV
                 VALUES (@maNV, '', @fullName, @email, @phone, @role, 'ACTIVE')`;
  insertRequest.input('maNV', sql.VarChar, newMaNV);
  insertRequest.input('fullName', sql.NVarChar, fullName);
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
export const findCustomerByEmail = async (email) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('email', sql.VarChar, email);
  const result = await request.query(`SELECT * FROM dbo.KHACHHANG WHERE Email = @email`);
  return result.recordset[0];
};

/** Find account by username */
export const findAccountByUsername = async (username) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('username', sql.VarChar, username);
  const result = await request.query(`SELECT * FROM dbo.TAIKHOAN WHERE TenDangNhap = @username`);
  return result.recordset[0];
};

/** Get customer profile */
export const getCustomerById = async (id) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('id', sql.VarChar, id);
  const result = await request.query(`SELECT MaKH AS id, TenKH AS fullName, Email AS email FROM dbo.KHACHHANG WHERE MaKH = @id`);
  return result.recordset[0];
};

/** Get employee profile */
export const getEmployeeById = async (id) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('id', sql.VarChar, id);
  const result = await request.query(`SELECT MaNV AS id, CONCAT(Ho, ' ', Ten) AS fullName, Email AS email FROM dbo.NHANVIEN WHERE MaNV = @id`);
  return result.recordset[0];
};
