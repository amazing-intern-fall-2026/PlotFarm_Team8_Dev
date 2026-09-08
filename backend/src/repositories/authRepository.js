// src/repositories/authRepository.js
import sql from 'mssql';
import { getPool } from '../config/database.js';

/** Insert a new customer and return generated MaKH */
export const createCustomer = async ({ fullName, email, phone, shippingAddress }) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  const query = `INSERT INTO dbo.KHACHHANG (TenKH, Email, DienThoai, DiaChi, TrangThai)
                 OUTPUT INSERTED.MaKH
                 VALUES (@fullName, @email, @phone, @address, N'ACTIVE')`;
  request.input('fullName', sql.NVarChar, fullName);
  request.input('email', sql.VarChar, email);
  request.input('phone', sql.VarChar, phone);
  request.input('address', sql.NVarChar, shippingAddress);
  const result = await request.query(query);
  return result.recordset[0].MaKH;
};

/** Insert a new account linked to a customer */
export const createAccountForCustomer = async ({ username, passwordHash, role, maKH }) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  const query = `INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
                 VALUES (@username, @hash, @role, @maKH)`;
  request.input('username', sql.VarChar, username);
  request.input('hash', sql.VarChar, passwordHash);
  request.input('role', sql.VarChar, role);
  request.input('maKH', sql.VarChar, maKH);
  await request.query(query);
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
