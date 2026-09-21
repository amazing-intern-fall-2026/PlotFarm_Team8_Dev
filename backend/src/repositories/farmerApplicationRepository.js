// src/repositories/farmerApplicationRepository.js
import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

/** Insert a new farmer application with full KYC & CCCD info */
export const createApplication = async (data, transaction) => {
  const pool = transaction || getPool();
  const maDon = await generateIncrementalId(pool, 'DON_DANGKY_NONGDAN', 'MaDon', 'DKND', 3);

  const request = new sql.Request(pool);
  const query = `
    INSERT INTO dbo.DON_DANGKY_NONGDAN (
      MaDon, HoTen, NgaySinh, GioiTinh, Email, DienThoai, DiaChi,
      SoCCCD, NgayCap, NoiCap, AnhCCCDMatTruoc, AnhCCCDMatSau,
      TenDangNhap, MatKhauHash, KinhNghiem, TrangThai
    )
    OUTPUT INSERTED.MaDon, INSERTED.HoTen, INSERTED.Email, INSERTED.DienThoai, INSERTED.TrangThai, INSERTED.NgayDangKy
    VALUES (
      @maDon, @hoTen, @ngaySinh, @gioiTinh, @email, @dienThoai, @diaChi,
      @soCCCD, @ngayCap, @noiCap, @anhTruoc, @anhSau,
      @tenDangNhap, @matKhauHash, @kinhNghiem, 'PENDING'
    )
  `;

  request.input('maDon', sql.VarChar, maDon);
  request.input('hoTen', sql.NVarChar, data.fullName);
  request.input('ngaySinh', sql.Date, data.birthDate || null);
  request.input('gioiTinh', sql.NVarChar, data.gender || null);
  request.input('email', sql.VarChar, data.email);
  request.input('dienThoai', sql.VarChar, data.phone);
  request.input('diaChi', sql.NVarChar, data.address || '');
  request.input('soCCCD', sql.VarChar, data.citizenId);
  request.input('ngayCap', sql.Date, data.issueDate || null);
  request.input('noiCap', sql.NVarChar, data.issuePlace || null);
  request.input('anhTruoc', sql.NVarChar(sql.MAX), data.frontCardImage || null);
  request.input('anhSau', sql.NVarChar(sql.MAX), data.backCardImage || null);
  request.input('tenDangNhap', sql.VarChar, data.username);
  request.input('matKhauHash', sql.VarChar, data.passwordHash);
  request.input('kinhNghiem', sql.NVarChar, data.experience || null);

  const result = await request.query(query);
  return result.recordset[0];
};

/** Find application by ID */
export const findApplicationById = async (maDon, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('maDon', sql.VarChar, maDon);
  const result = await request.query(`
    SELECT * FROM dbo.DON_DANGKY_NONGDAN WHERE MaDon = @maDon
  `);
  return result.recordset[0] || null;
};

/** Find pending application by username */
export const findApplicationByUsername = async (username, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('username', sql.VarChar, username);
  const result = await request.query(`
    SELECT TOP 1 * FROM dbo.DON_DANGKY_NONGDAN 
    WHERE TenDangNhap = @username AND TrangThai = 'PENDING'
  `);
  return result.recordset[0] || null;
};

/** Find application by CCCD (prevent duplicate pending applications) */
export const findApplicationByCCCD = async (soCCCD, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('soCCCD', sql.VarChar, soCCCD);
  const result = await request.query(`
    SELECT TOP 1 * FROM dbo.DON_DANGKY_NONGDAN 
    WHERE SoCCCD = @soCCCD AND TrangThai = 'PENDING'
  `);
  return result.recordset[0] || null;
};

/** Find pending application by email */
export const findApplicationByEmail = async (email, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('email', sql.VarChar, email);
  const result = await request.query(`
    SELECT TOP 1 * FROM dbo.DON_DANGKY_NONGDAN 
    WHERE Email = @email AND TrangThai = 'PENDING'
  `);
  return result.recordset[0] || null;
};

/** Find pending application by phone */
export const findApplicationByPhone = async (phone, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('phone', sql.VarChar, phone);
  const result = await request.query(`
    SELECT TOP 1 * FROM dbo.DON_DANGKY_NONGDAN 
    WHERE DienThoai = @phone AND TrangThai = 'PENDING'
  `);
  return result.recordset[0] || null;
};

/** Get all applications with optional status filter */
export const getAllApplications = async (status = 'ALL') => {
  const request = new sql.Request(getPool());
  let query = `
    SELECT 
      MaDon, HoTen, NgaySinh, GioiTinh, Email, DienThoai, DiaChi,
      SoCCCD, NgayCap, NoiCap, AnhCCCDMatTruoc, AnhCCCDMatSau,
      TenDangNhap, KinhNghiem, TrangThai, LyDoTuChoi,
      NgayDangKy, NgayXuLy, NguoiXuLy
    FROM dbo.DON_DANGKY_NONGDAN
  `;

  if (status && status !== 'ALL') {
    query += ` WHERE TrangThai = @status`;
    request.input('status', sql.VarChar, status);
  }

  query += ` ORDER BY NgayDangKy DESC`;
  const result = await request.query(query);
  return result.recordset;
};

/** Update application status (APPROVED or REJECTED) */
export const updateApplicationStatus = async (maDon, { status, note, processedBy }, transaction) => {
  const request = new sql.Request(transaction || getPool());
  request.input('maDon', sql.VarChar, maDon);
  request.input('status', sql.VarChar, status);
  request.input('note', sql.NVarChar, note || null);
  request.input('processedBy', sql.VarChar, processedBy || 'admin');

  const result = await request.query(`
    UPDATE dbo.DON_DANGKY_NONGDAN
    SET 
      TrangThai = @status,
      LyDoTuChoi = @note,
      NgayXuLy = SYSUTCDATETIME(),
      NguoiXuLy = @processedBy
    OUTPUT INSERTED.*
    WHERE MaDon = @maDon
  `);
  return result.recordset[0] || null;
};
