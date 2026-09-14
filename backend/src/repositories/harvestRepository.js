import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

const BASE_SELECT = `
    SELECT
        TH.*,
        HD.MaKH,
        KH.TenKH,
        KH.Email AS EmailKhachHang,
        KH.DienThoai AS DienThoaiKhachHang,
        OD.MaODat,
        OD.TenODat,
        NT.MaNongTrai,
        NT.TenNongTrai,
        NT.MaChuNongTrai,
        CT.MaCayTrong,
        CT.TenCayTrong,
        CT.LoaiCay
    FROM dbo.THUHOACH TH
    JOIN dbo.HOPDONGTHUE HD ON TH.MaHopDong  = HD.MaHopDong
    LEFT JOIN dbo.KHACHHANG   KH ON HD.MaKH      = KH.MaKH
    LEFT JOIN dbo.ODAT        OD ON HD.MaODat     = OD.MaODat
    LEFT JOIN dbo.NONGTRAI    NT ON OD.MaNongTrai = NT.MaNongTrai
    LEFT JOIN dbo.CAYTRONG    CT ON HD.MaCayTrong = CT.MaCayTrong
`;

export const getHarvests = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    const conditions = [];

    if (filters.contractId) {
        request.input('contractId', sql.VarChar, filters.contractId);
        conditions.push('TH.MaHopDong = @contractId');
    }

    if (filters.trangThaiThuHoach) {
        request.input('trangThaiThuHoach', sql.VarChar, filters.trangThaiThuHoach);
        conditions.push('TH.TrangThaiThuHoach = @trangThaiThuHoach');
    }

    if (filters.trangThaiDongGoi) {
        request.input('trangThaiDongGoi', sql.VarChar, filters.trangThaiDongGoi);
        conditions.push('TH.TrangThaiDongGoi = @trangThaiDongGoi');
    }

    if (filters.trangThaiGiaoHang) {
        request.input('trangThaiGiaoHang', sql.VarChar, filters.trangThaiGiaoHang);
        conditions.push('TH.TrangThaiGiaoHang = @trangThaiGiaoHang');
    }

    if (filters.customerId) {
        request.input('customerId', sql.VarChar, filters.customerId);
        conditions.push('HD.MaKH = @customerId');
    }

    if (filters.farmerId) {
        request.input('farmerId', sql.VarChar, filters.farmerId);
        conditions.push('NT.MaChuNongTrai = @farmerId');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await request.query(`
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY TH.CreatedAt DESC
    `);
    return result.recordset;
};

export const getHarvestsByCustomerId = async (maKH) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('maKH', sql.VarChar, maKH);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE HD.MaKH = @maKH
        ORDER BY TH.CreatedAt DESC
    `);
    return result.recordset;
};

export const getHarvestById = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE TH.MaThuHoach = @id
    `);
    return result.recordset[0];
};

export const checkContract = async (maHopDong) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('maHopDong', sql.VarChar, maHopDong);

    const result = await request.query(`
        SELECT HD.*, KH.DiaChiNhanHang
        FROM dbo.HOPDONGTHUE HD
        LEFT JOIN dbo.KHACHHANG KH ON HD.MaKH = KH.MaKH
        WHERE HD.MaHopDong = @maHopDong
    `);
    return result.recordset[0];
};

export const createHarvest = async (data) => {
    const pool = getPool();
    const maThuHoach = await generateIncrementalId(pool, 'THUHOACH', 'MaThuHoach', 'TH', 3);

    const request = new sql.Request(pool);
    request.input('maThuHoach',          sql.VarChar,   maThuHoach);
    request.input('maHopDong',           sql.VarChar,   data.MaHopDong);
    request.input('ngayThuHoachDuKien',  sql.Date,      data.NgayThuHoachDuKien);
    request.input('sanLuongDuKien',      sql.NVarChar,  data.SanLuongDuKien);
    request.input('trangThaiThuHoach',   sql.VarChar,   data.TrangThaiThuHoach || 'SCHEDULED');
    request.input('trangThaiDongGoi',    sql.VarChar,   data.TrangThaiDongGoi || 'NOT_PACKED');
    request.input('trangThaiGiaoHang',   sql.VarChar,   data.TrangThaiGiaoHang || 'WAITING_PICKUP');
    request.input('diaChiGiaoHang',      sql.NVarChar,  data.DiaChiGiaoHang);
    request.input('ghiChu',              sql.NVarChar,  data.GhiChu || null);

    const result = await request.query(`
        INSERT INTO dbo.THUHOACH
            (MaThuHoach, MaHopDong, NgayThuHoachDuKien, SanLuongDuKien,
             TrangThaiThuHoach, TrangThaiDongGoi, TrangThaiGiaoHang,
             DiaChiGiaoHang, GhiChu)
        OUTPUT INSERTED.*
        VALUES
            (@maThuHoach, @maHopDong, @ngayThuHoachDuKien, @sanLuongDuKien,
             @trangThaiThuHoach, @trangThaiDongGoi, @trangThaiGiaoHang,
             @diaChiGiaoHang, @ghiChu)
    `);
    return result.recordset[0];
};

export const updateHarvest = async (id, data) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const setClauses = [];

    if (data.NgayThuHoachDuKien !== undefined) {
        request.input('ngayThuHoachDuKien', sql.Date, data.NgayThuHoachDuKien);
        setClauses.push('NgayThuHoachDuKien = @ngayThuHoachDuKien');
    }
    if (data.NgayThuHoachThucTe !== undefined) {
        request.input('ngayThuHoachThucTe', sql.Date, data.NgayThuHoachThucTe);
        setClauses.push('NgayThuHoachThucTe = @ngayThuHoachThucTe');
    }
    if (data.SanLuongDuKien !== undefined) {
        request.input('sanLuongDuKien', sql.NVarChar, data.SanLuongDuKien);
        setClauses.push('SanLuongDuKien = @sanLuongDuKien');
    }
    if (data.SanLuongThucTe !== undefined) {
        request.input('sanLuongThucTe', sql.NVarChar, data.SanLuongThucTe);
        setClauses.push('SanLuongThucTe = @sanLuongThucTe');
    }
    if (data.TrangThaiThuHoach !== undefined) {
        request.input('trangThaiThuHoach', sql.VarChar, data.TrangThaiThuHoach);
        setClauses.push('TrangThaiThuHoach = @trangThaiThuHoach');
    }
    if (data.TrangThaiDongGoi !== undefined) {
        request.input('trangThaiDongGoi', sql.VarChar, data.TrangThaiDongGoi);
        setClauses.push('TrangThaiDongGoi = @trangThaiDongGoi');
    }
    if (data.TrangThaiGiaoHang !== undefined) {
        request.input('trangThaiGiaoHang', sql.VarChar, data.TrangThaiGiaoHang);
        setClauses.push('TrangThaiGiaoHang = @trangThaiGiaoHang');
    }
    if (data.DiaChiGiaoHang !== undefined) {
        request.input('diaChiGiaoHang', sql.NVarChar, data.DiaChiGiaoHang);
        setClauses.push('DiaChiGiaoHang = @diaChiGiaoHang');
    }
    if (data.MaVanDon !== undefined) {
        request.input('maVanDon', sql.VarChar, data.MaVanDon);
        setClauses.push('MaVanDon = @maVanDon');
    }
    if (data.GhiChu !== undefined) {
        request.input('ghiChu', sql.NVarChar, data.GhiChu);
        setClauses.push('GhiChu = @ghiChu');
    }

    if (setClauses.length === 0) return null;

    setClauses.push('UpdatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
        UPDATE dbo.THUHOACH
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE MaThuHoach = @id
    `);
    return result.recordset[0];
};
