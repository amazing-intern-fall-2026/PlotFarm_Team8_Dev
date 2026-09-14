import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

export const getAllPlots = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    let query = `
        SELECT OD.*, NT.TenNongTrai, NT.MaChuNongTrai
        FROM dbo.ODAT OD
        JOIN dbo.NONGTRAI NT ON OD.MaNongTrai = NT.MaNongTrai
        WHERE 1=1
    `;
    if (filters.farmId) {
        query += ` AND OD.MaNongTrai = @farmId`;
        request.input('farmId', sql.VarChar, filters.farmId);
    }
    if (filters.trangThai) {
        query += ` AND OD.TrangThai = @trangThai`;
        request.input('trangThai', sql.VarChar, filters.trangThai);
    }
    const result = await request.query(query);
    return result.recordset;
};

export const getPlotById = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);
    const result = await request.query(`
        SELECT OD.*, NT.TenNongTrai, NT.MaChuNongTrai
        FROM dbo.ODAT OD
        JOIN dbo.NONGTRAI NT ON OD.MaNongTrai = NT.MaNongTrai
        WHERE OD.MaODat = @id
    `);
    return result.recordset[0];
};

export const createPlot = async (data) => {
    const pool = getPool();
    const newMaODat = await generateIncrementalId(pool, 'ODAT', 'MaODat', 'OD', 3);
    const request = new sql.Request(pool);
    
    const query = `
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail)
        OUTPUT INSERTED.*
        VALUES (@maODat, @maNongTrai, @tenODat, @dienTich, @trangThai, @giaThue, @cameraUrl, @hinhAnhThumbnail)
    `;
    request.input('maODat', sql.VarChar, newMaODat);
    request.input('maNongTrai', sql.VarChar, data.MaNongTrai);
    request.input('tenODat', sql.NVarChar, data.TenODat);
    request.input('dienTich', sql.Decimal(10,2), data.DienTich);
    request.input('trangThai', sql.VarChar, data.TrangThai || 'TRONG');
    request.input('giaThue', sql.Decimal(18,0), data.GiaThue);
    request.input('cameraUrl', sql.NVarChar, data.CameraUrl ?? null);
    request.input('hinhAnhThumbnail', sql.NVarChar, data.HinhAnhThumbnail ?? null);

    const result = await request.query(query);
    return result.recordset[0];
};

export const updatePlot = async (id, data) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    let updates = [];

    if (data.TenODat !== undefined) { updates.push('TenODat = @tenODat'); request.input('tenODat', sql.NVarChar, data.TenODat); }
    if (data.DienTich !== undefined) { updates.push('DienTich = @dienTich'); request.input('dienTich', sql.Decimal(10,2), data.DienTich); }
    if (data.TrangThai !== undefined) { updates.push('TrangThai = @trangThai'); request.input('trangThai', sql.VarChar, data.TrangThai); }
    if (data.GiaThue !== undefined) { updates.push('GiaThue = @giaThue'); request.input('giaThue', sql.Decimal(18,0), data.GiaThue); }
    if (data.CameraUrl !== undefined) { updates.push('CameraUrl = @cameraUrl'); request.input('cameraUrl', sql.NVarChar, data.CameraUrl); }
    if (data.HinhAnhThumbnail !== undefined) { updates.push('HinhAnhThumbnail = @thumbnail'); request.input('thumbnail', sql.NVarChar, data.HinhAnhThumbnail); }
    
    if (updates.length === 0) {
        return getPlotById(id);
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');

    request.input('id', sql.VarChar, id);
    const query = `
        UPDATE dbo.ODAT SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE MaODat = @id
    `;
    const result = await request.query(query);
    return result.recordset[0];
};

export const updatePlotSensor = async (id, sensorData) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    let updates = [];

    if (sensorData.DoAmDat !== undefined) { updates.push('DoAmDat = @doAmDat'); request.input('doAmDat', sql.Decimal(5,2), sensorData.DoAmDat); }
    if (sensorData.NhietDo !== undefined) { updates.push('NhietDo = @nhietDo'); request.input('nhietDo', sql.Decimal(5,2), sensorData.NhietDo); }
    if (sensorData.DoPH !== undefined) { updates.push('DoPH = @doPH'); request.input('doPH', sql.Decimal(4,2), sensorData.DoPH); }
    if (sensorData.AnhSangLux !== undefined) { updates.push('AnhSangLux = @anhSangLux'); request.input('anhSangLux', sql.Int, sensorData.AnhSangLux); }
    
    if (updates.length === 0) {
        return getPlotById(id);
    }

    updates.push('UpdatedAt = SYSUTCDATETIME()');

    request.input('id', sql.VarChar, id);
    const query = `
        UPDATE dbo.ODAT SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE MaODat = @id
    `;
    const result = await request.query(query);
    return result.recordset[0];
};
