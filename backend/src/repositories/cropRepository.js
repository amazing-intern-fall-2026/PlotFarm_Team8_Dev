import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

export const getAllCrops = async () => {
  const pool = getPool();
  const request = new sql.Request(pool);
  const result = await request.query(`
    SELECT MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach, CreatedAt, UpdatedAt
    FROM dbo.CAYTRONG
    ORDER BY MaCayTrong ASC
  `);
  return result.recordset;
};

export const getCropById = async (id) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('id', sql.VarChar, id);
  const result = await request.query(`
    SELECT MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach, CreatedAt, UpdatedAt
    FROM dbo.CAYTRONG
    WHERE MaCayTrong = @id
  `);
  return result.recordset[0] || null;
};

export const createCrop = async (cropData) => {
  const pool = getPool();
  const newMaCayTrong = await generateIncrementalId(pool, 'CAYTRONG', 'MaCayTrong', 'CT', 3);

  const request = new sql.Request(pool);
  const query = `
    INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
    OUTPUT INSERTED.*
    VALUES (@maCayTrong, @tenCayTrong, @loaiCay, @thoiGianThuHoach)
  `;
  request.input('maCayTrong', sql.VarChar, newMaCayTrong);
  request.input('tenCayTrong', sql.NVarChar, cropData.TenCayTrong);
  request.input('loaiCay', sql.NVarChar, cropData.LoaiCay);
  request.input('thoiGianThuHoach', sql.Int, cropData.ThoiGianThuHoach);

  const result = await request.query(query);
  return result.recordset[0];
};
