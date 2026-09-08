// src/repositories/authRepository.js
import sql from 'mssql';
import { getPool } from '../config/database.js';

/** Insert a new customer and return generated MaKH */
export const createCustomer = async ({ fullName, email, phone, shippingAddress }, transaction) => {
  const idRequest = new sql.Request(transaction || getPool());
  const idResult = await idRequest.query(`
    SELECT TOP 1 MaKH FROM dbo.KHACHHANG WITH (UPDLOCK, HOLDLOCK)
    WHERE MaKH LIKE 'KH%'
    ORDER BY LEN(MaKH) DESC, MaKH DESC
  `);

  let newMaKH = 'KH001';
  if (idResult.recordset.length > 0 && idResult.recordset[0].MaKH) {
    const lastMaKH = idResult.recordset[0].MaKH;
    const match = lastMaKH.match(/^KH(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      newMaKH = `KH${String(nextNum).padStart(match[1].length, '0')}`;
    } else {
      newMaKH = `KH${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
  }

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
