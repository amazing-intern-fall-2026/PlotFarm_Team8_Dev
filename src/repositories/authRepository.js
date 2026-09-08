import sql from 'mssql';
import { getPool } from '../config/database.js';

export const findAccountByUsername = async (username) => {
  const pool = getPool();
  const result = await pool.request()
    .input('username', sql.VarChar(50), username)
    .query(`
      SELECT TenDangNhap, MatKhauHash, MaVaiTro, MaKH, MaNV 
      FROM dbo.TAIKHOAN 
      WHERE TenDangNhap = @username
    `);
  return result.recordset[0];
};

export const createCustomerAccount = async (customerData, accountData) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Insert Customer
    await transaction.request()
      .input('MaKH', sql.VarChar(20), customerData.MaKH)
      .input('TenKH', sql.NVarChar(255), customerData.TenKH)
      .input('Email', sql.VarChar(254), customerData.Email)
      .input('DienThoai', sql.VarChar(15), customerData.DienThoai)
      .input('DiaChi', sql.NVarChar(500), customerData.DiaChi)
      .input('TrangThai', sql.VarChar(20), customerData.TrangThai)
      .query(`
        INSERT INTO dbo.KHACHHANG (MaKH, TenKH, Email, DienThoai, DiaChi, TrangThai)
        VALUES (@MaKH, @TenKH, @Email, @DienThoai, @DiaChi, @TrangThai)
      `);

    // Insert Account
    await transaction.request()
      .input('TenDangNhap', sql.VarChar(50), accountData.TenDangNhap)
      .input('MatKhauHash', sql.VarChar(255), accountData.MatKhauHash)
      .input('MaVaiTro', sql.VarChar(20), accountData.MaVaiTro)
      .input('MaKH', sql.VarChar(20), accountData.MaKH)
      .query(`
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
        VALUES (@TenDangNhap, @MatKhauHash, @MaVaiTro, @MaKH)
      `);

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getUserProfile = async (username) => {
  const pool = getPool();
  const result = await pool.request()
    .input('username', sql.VarChar(50), username)
    .query(`
      SELECT 
        tk.TenDangNhap, tk.MaVaiTro,
        kh.MaKH, kh.TenKH, kh.Email as KHEmail, kh.DienThoai as KHDienThoai, kh.DiaChi as KHDiaChi, kh.TrangThai as KHTrangThai,
        nv.MaNV, nv.Ho as NVHo, nv.Ten as NVTen, nv.Email as NVEmail, nv.DienThoai as NVDienThoai, nv.ChucVu, nv.TrangThai as NVTrangThai
      FROM dbo.TAIKHOAN tk
      LEFT JOIN dbo.KHACHHANG kh ON tk.MaKH = kh.MaKH
      LEFT JOIN dbo.NHANVIEN nv ON tk.MaNV = nv.MaNV
      WHERE tk.TenDangNhap = @username
    `);
  
  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  
  // Format response to hide null fields from the other role
  const profile = {
    TenDangNhap: row.TenDangNhap,
    MaVaiTro: row.MaVaiTro,
  };

  if (row.MaKH) {
    profile.KhachHang = {
      MaKH: row.MaKH,
      TenKH: row.TenKH,
      Email: row.KHEmail,
      DienThoai: row.KHDienThoai,
      DiaChi: row.KHDiaChi,
      TrangThai: row.KHTrangThai
    };
  } else if (row.MaNV) {
    profile.NhanVien = {
      MaNV: row.MaNV,
      HoTen: row.NVHo + ' ' + row.NVTen,
      Email: row.NVEmail,
      DienThoai: row.NVDienThoai,
      ChucVu: row.ChucVu,
      TrangThai: row.NVTrangThai
    };
  }

  return profile;
};

export const checkEmailExists = async (email) => {
  const pool = getPool();
  const result = await pool.request()
    .input('email', sql.VarChar(254), email)
    .query(`
      SELECT 1 FROM dbo.KHACHHANG WHERE Email = @email
      UNION
      SELECT 1 FROM dbo.NHANVIEN WHERE Email = @email
    `);
  return result.recordset.length > 0;
};
