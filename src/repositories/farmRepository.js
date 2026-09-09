import sql from 'mssql';
import { getPool } from '../config/database.js';

export const getAllFarms = async (status = null) => {
  const pool = getPool();
  let query = 'SELECT * FROM dbo.NONGTRAI';
  
  if (status) {
    return (await pool.request()
      .input('status', sql.VarChar(20), status)
      .query(query + ' WHERE TrangThai = @status')).recordset;
  }
  
  return (await pool.request().query(query)).recordset;
};

export const getFarmsByFarmerId = async (maChuNongTrai) => {
  const pool = getPool();
  const result = await pool.request()
    .input('maChu', sql.VarChar(20), maChuNongTrai)
    .query('SELECT * FROM dbo.NONGTRAI WHERE MaChuNongTrai = @maChu');
  return result.recordset;
};

export const getFarmById = async (id) => {
  const pool = getPool();
  const result = await pool.request()
    .input('id', sql.VarChar(20), id)
    .query('SELECT * FROM dbo.NONGTRAI WHERE MaNongTrai = @id');
  return result.recordset[0];
};

export const createFarm = async (farmData) => {
  const pool = getPool();
  await pool.request()
    .input('MaNongTrai', sql.VarChar(20), farmData.MaNongTrai)
    .input('TenNongTrai', sql.NVarChar(255), farmData.TenNongTrai)
    .input('MaChuNongTrai', sql.VarChar(20), farmData.MaChuNongTrai)
    .input('DiaChi', sql.NVarChar(500), farmData.DiaChi)
    .input('TrangThai', sql.VarChar(20), farmData.TrangThai || 'PENDING')
    .query(`
      INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
      VALUES (@MaNongTrai, @TenNongTrai, @MaChuNongTrai, @DiaChi, @TrangThai)
    `);
  return farmData;
};

export const updateFarm = async (id, farmData) => {
  const pool = getPool();
  const request = pool.request().input('id', sql.VarChar(20), id);
  let updates = [];
  
  if (farmData.TenNongTrai !== undefined) {
    updates.push('TenNongTrai = @TenNongTrai');
    request.input('TenNongTrai', sql.NVarChar(255), farmData.TenNongTrai);
  }
  if (farmData.DiaChi !== undefined) {
    updates.push('DiaChi = @DiaChi');
    request.input('DiaChi', sql.NVarChar(500), farmData.DiaChi);
  }
  if (farmData.TrangThai !== undefined) {
    updates.push('TrangThai = @TrangThai');
    request.input('TrangThai', sql.VarChar(20), farmData.TrangThai);
  }
  
  if (updates.length === 0) return null;

  updates.push('UpdatedAt = SYSUTCDATETIME()');
  
  const query = `UPDATE dbo.NONGTRAI SET ${updates.join(', ')} WHERE MaNongTrai = @id`;
  await request.query(query);
  return true;
};

export const deleteFarm = async (id) => {
  const pool = getPool();
  await pool.request()
    .input('id', sql.VarChar(20), id)
    .query('DELETE FROM dbo.NONGTRAI WHERE MaNongTrai = @id');
  return true;
};
