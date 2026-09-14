import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

// Base SELECT with full JOINs
const BASE_SELECT = `
    SELECT
        NK.*,
        NV.Ho + ' ' + NV.Ten AS TenNguoiGhi,
        OD.TenODat,
        OD.DoAmDat,
        OD.NhietDo,
        OD.DoPH,
        OD.AnhSangLux,
        HD.MaKH
    FROM dbo.NHATKYCANHTAC NK
    LEFT JOIN dbo.NHANVIEN      NV ON NK.NguoiGhi  = NV.MaNV
    LEFT JOIN dbo.ODAT          OD ON NK.MaODat     = OD.MaODat
    LEFT JOIN dbo.HOPDONGTHUE   HD ON NK.MaHopDong  = HD.MaHopDong
`;

// Get logs with optional filters: contractId, plotId
export const getLogs = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);

    const conditions = [];

    if (filters.contractId) {
        request.input('contractId', sql.VarChar, filters.contractId);
        conditions.push('NK.MaHopDong = @contractId');
    }

    if (filters.plotId) {
        request.input('plotId', sql.VarChar, filters.plotId);
        conditions.push('NK.MaODat = @plotId');
    }

    // CUSTOMER filter: only logs whose contract belongs to this customer
    if (filters.maKH) {
        request.input('maKH', sql.VarChar, filters.maKH);
        conditions.push('HD.MaKH = @maKH');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await request.query(`
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY NK.NgayGhi DESC
    `);
    return result.recordset;
};

// Get a single log by ID
export const getLogById = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE NK.MaNhatKy = @id
    `);
    return result.recordset[0];
};

// Create a new farming log entry
export const createLog = async (data) => {
    const pool = getPool();
    const maNhatKy = await generateIncrementalId(pool, 'NHATKYCANHTAC', 'MaNhatKy', 'NK', 3);

    const request = new sql.Request(pool);
    request.input('maNhatKy',          sql.VarChar,   maNhatKy);
    request.input('maHopDong',         sql.VarChar,   data.MaHopDong);
    request.input('maODat',            sql.VarChar,   data.MaODat);
    request.input('hoatDong',          sql.NVarChar,  data.HoatDong);
    request.input('giaiDoanCay',       sql.NVarChar,  data.GiaiDoanCay);
    request.input('tienDoPhanTram',    sql.Int,       data.TienDoPhanTram ?? 0);
    request.input('moTa',              sql.NVarChar,  data.MoTa || null);
    request.input('hinhAnhMinhChung',  sql.NVarChar,  data.HinhAnhMinhChung || null);
    request.input('nguoiGhi',          sql.VarChar,   data.NguoiGhi);

    const result = await request.query(`
        INSERT INTO dbo.NHATKYCANHTAC
            (MaNhatKy, MaHopDong, MaODat, HoatDong, GiaiDoanCay,
             TienDoPhanTram, MoTa, HinhAnhMinhChung, NguoiGhi)
        OUTPUT INSERTED.*
        VALUES
            (@maNhatKy, @maHopDong, @maODat, @hoatDong, @giaiDoanCay,
             @tienDoPhanTram, @moTa, @hinhAnhMinhChung, @nguoiGhi)
    `);
    return result.recordset[0];
};

// Partial update of a log entry
export const updateLog = async (id, data) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const setClauses = [];

    if (data.HoatDong !== undefined) {
        request.input('hoatDong', sql.NVarChar, data.HoatDong);
        setClauses.push('HoatDong = @hoatDong');
    }
    if (data.GiaiDoanCay !== undefined) {
        request.input('giaiDoanCay', sql.NVarChar, data.GiaiDoanCay);
        setClauses.push('GiaiDoanCay = @giaiDoanCay');
    }
    if (data.TienDoPhanTram !== undefined) {
        request.input('tienDoPhanTram', sql.Int, data.TienDoPhanTram);
        setClauses.push('TienDoPhanTram = @tienDoPhanTram');
    }
    if (data.MoTa !== undefined) {
        request.input('moTa', sql.NVarChar, data.MoTa);
        setClauses.push('MoTa = @moTa');
    }
    if (data.HinhAnhMinhChung !== undefined) {
        request.input('hinhAnhMinhChung', sql.NVarChar, data.HinhAnhMinhChung);
        setClauses.push('HinhAnhMinhChung = @hinhAnhMinhChung');
    }

    if (setClauses.length === 0) return null;

    setClauses.push('UpdatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
        UPDATE dbo.NHATKYCANHTAC
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE MaNhatKy = @id
    `);
    return result.recordset[0];
};

// Delete a log entry
export const deleteLog = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    await request.query(`
        DELETE FROM dbo.NHATKYCANHTAC
        WHERE MaNhatKy = @id
    `);
};
