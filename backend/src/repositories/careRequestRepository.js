import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

const BASE_SELECT = `
    SELECT
        YC.*,
        KH.TenKH,
        KH.Email AS EmailKhachHang,
        KH.DienThoai AS DienThoaiKhachHang,
        HD.MaODat,
        OD.TenODat,
        NT.MaNongTrai,
        NT.TenNongTrai,
        NT.MaChuNongTrai,
        NV.Ho + ' ' + NV.Ten AS TenNguoiXuLy
    FROM dbo.YEUCAUCHAMSOC YC
    LEFT JOIN dbo.KHACHHANG   KH ON YC.MaKH      = KH.MaKH
    LEFT JOIN dbo.HOPDONGTHUE HD ON YC.MaHopDong  = HD.MaHopDong
    LEFT JOIN dbo.ODAT        OD ON HD.MaODat     = OD.MaODat
    LEFT JOIN dbo.NONGTRAI    NT ON OD.MaNongTrai = NT.MaNongTrai
    LEFT JOIN dbo.NHANVIEN    NV ON YC.NguoiXuLy  = NV.MaNV
`;

export const getCareRequests = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    const conditions = [];

    if (filters.trangThai) {
        request.input('trangThai', sql.VarChar, filters.trangThai);
        conditions.push('YC.TrangThai = @trangThai');
    }

    if (filters.contractId) {
        request.input('contractId', sql.VarChar, filters.contractId);
        conditions.push('YC.MaHopDong = @contractId');
    }

    if (filters.plotId) {
        request.input('plotId', sql.VarChar, filters.plotId);
        conditions.push('HD.MaODat = @plotId');
    }

    if (filters.customerId) {
        request.input('customerId', sql.VarChar, filters.customerId);
        conditions.push('YC.MaKH = @customerId');
    }

    if (filters.farmerId) {
        request.input('farmerId', sql.VarChar, filters.farmerId);
        conditions.push('NT.MaChuNongTrai = @farmerId');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await request.query(`
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY YC.CreatedAt DESC
    `);
    return result.recordset;
};

export const getCareRequestsByCustomerId = async (maKH) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('maKH', sql.VarChar, maKH);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE YC.MaKH = @maKH
        ORDER BY YC.CreatedAt DESC
    `);
    return result.recordset;
};

export const getCareRequestById = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE YC.MaYeuCau = @id
    `);
    return result.recordset[0];
};

export const checkContract = async (maHopDong) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('maHopDong', sql.VarChar, maHopDong);

    const result = await request.query(`
        SELECT MaHopDong, MaKH, MaODat, TrangThai
        FROM dbo.HOPDONGTHUE
        WHERE MaHopDong = @maHopDong
    `);
    return result.recordset[0];
};

export const createCareRequest = async (data) => {
    const pool = getPool();
    const maYeuCau = await generateIncrementalId(pool, 'YEUCAUCHAMSOC', 'MaYeuCau', 'YC', 3);

    const request = new sql.Request(pool);
    request.input('maYeuCau',    sql.VarChar,   maYeuCau);
    request.input('maHopDong',   sql.VarChar,   data.MaHopDong);
    request.input('maKH',        sql.VarChar,   data.MaKH);
    request.input('loaiYeuCau',  sql.NVarChar,  data.LoaiYeuCau);
    request.input('moTa',        sql.NVarChar,  data.MoTa);
    request.input('trangThai',   sql.VarChar,   data.TrangThai || 'PENDING');

    const result = await request.query(`
        INSERT INTO dbo.YEUCAUCHAMSOC
            (MaYeuCau, MaHopDong, MaKH, LoaiYeuCau, MoTa, TrangThai)
        OUTPUT INSERTED.*
        VALUES
            (@maYeuCau, @maHopDong, @maKH, @loaiYeuCau, @moTa, @trangThai)
    `);
    return result.recordset[0];
};

export const updateCareRequestStatus = async (id, data) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const setClauses = [];

    if (data.TrangThai !== undefined) {
        request.input('trangThai', sql.VarChar, data.TrangThai);
        setClauses.push('TrangThai = @trangThai');
    }

    if (data.GhiChuPhanHoi !== undefined) {
        request.input('ghiChuPhanHoi', sql.NVarChar, data.GhiChuPhanHoi);
        setClauses.push('GhiChuPhanHoi = @ghiChuPhanHoi');
    }

    if (data.HinhAnhKetQua !== undefined) {
        request.input('hinhAnhKetQua', sql.NVarChar, data.HinhAnhKetQua);
        setClauses.push('HinhAnhKetQua = @hinhAnhKetQua');
    }

    if (data.NguoiXuLy !== undefined) {
        request.input('nguoiXuLy', sql.VarChar, data.NguoiXuLy);
        setClauses.push('NguoiXuLy = @nguoiXuLy');
    }

    if (data.CompletedAt !== undefined) {
        request.input('completedAt', sql.DateTime2, data.CompletedAt);
        setClauses.push('CompletedAt = @completedAt');
    }

    if (setClauses.length === 0) return null;

    setClauses.push('UpdatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
        UPDATE dbo.YEUCAUCHAMSOC
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE MaYeuCau = @id
    `);
    return result.recordset[0];
};
