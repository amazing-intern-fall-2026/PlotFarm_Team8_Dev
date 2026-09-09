import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

export const getAllFarms = async (status = null) => {
  const pool = getPool();
  let query = 'SELECT * FROM dbo.NONGTRAI';
  const request = new sql.Request(pool);
  if (status) {
    query += ' WHERE TrangThai = @status';
    request.input('status', sql.VarChar, status);
  }
  const result = await request.query(query);
  return result.recordset;
};

export const getFarmsByFarmerId = async (farmerId) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('farmerId', sql.VarChar, farmerId);
  const result = await request.query(`SELECT * FROM dbo.NONGTRAI WHERE MaChuNongTrai = @farmerId`);
  return result.recordset;
};

export const getFarmById = async (id) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('id', sql.VarChar, id);
  const result = await request.query(`SELECT * FROM dbo.NONGTRAI WHERE MaNongTrai = @id`);
  return result.recordset[0];
};

export const createFarm = async (farmData) => {
  const newMaNongTrai = await generateIncrementalId(getPool(), 'NONGTRAI', 'MaNongTrai', 'FARM', 3);
  
  const pool = getPool();
  const request = new sql.Request(pool);
  const query = `
    INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
    OUTPUT INSERTED.*
    VALUES (@maNongTrai, @tenNongTrai, @maChuNongTrai, @diaChi, @trangThai)
  `;
  request.input('maNongTrai', sql.VarChar, newMaNongTrai);
  request.input('tenNongTrai', sql.NVarChar, farmData.TenNongTrai);
  request.input('maChuNongTrai', sql.VarChar, farmData.MaChuNongTrai);
  request.input('diaChi', sql.NVarChar, farmData.DiaChi);
  request.input('trangThai', sql.VarChar, farmData.TrangThai || 'PENDING');
  
  const result = await request.query(query);
  return result.recordset[0];
};

export const updateFarm = async (id, farmData) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  
  let updates = [];
  if (farmData.TenNongTrai) { updates.push('TenNongTrai = @tenNongTrai'); request.input('tenNongTrai', sql.NVarChar, farmData.TenNongTrai); }
  if (farmData.DiaChi) { updates.push('DiaChi = @diaChi'); request.input('diaChi', sql.NVarChar, farmData.DiaChi); }
  if (farmData.TrangThai) { updates.push('TrangThai = @trangThai'); request.input('trangThai', sql.VarChar, farmData.TrangThai); }
  
  updates.push('UpdatedAt = SYSUTCDATETIME()');
  
  if (updates.length === 0) return null;
  
  request.input('id', sql.VarChar, id);
  const query = `
    UPDATE dbo.NONGTRAI SET ${updates.join(', ')}
    OUTPUT INSERTED.*
    WHERE MaNongTrai = @id
  `;
  
  const result = await request.query(query);
  return result.recordset[0];
};

export const deleteFarm = async (id) => {
  const pool = getPool();
  const request = new sql.Request(pool);
  request.input('id', sql.VarChar, id);
  await request.query(`DELETE FROM dbo.NONGTRAI WHERE MaNongTrai = @id`);
};
