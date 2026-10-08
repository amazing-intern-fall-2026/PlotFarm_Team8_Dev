import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

const BASE_SELECT = `
    SELECT
        TT.*,
        KH.TenKH, KH.Email, KH.DienThoai,
        HD.MaODat, HD.MaCayTrong, HD.NgayBatDau, HD.NgayKetThuc,
        HD.TongTien AS TongTienHopDong, HD.TrangThai AS TrangThaiHopDong,
        OD.TenODat, OD.DienTich,
        NT.TenNongTrai, NT.MaNongTrai
    FROM dbo.THANHTOAN TT
    JOIN dbo.KHACHHANG   KH ON TT.MaKH      = KH.MaKH
    JOIN dbo.HOPDONGTHUE HD ON TT.MaHopDong = HD.MaHopDong
    JOIN dbo.ODAT        OD ON HD.MaODat    = OD.MaODat
    JOIN dbo.NONGTRAI    NT ON OD.MaNongTrai = NT.MaNongTrai
`;

export const createPayment = async (data, transaction) => {
    const newId = await generateIncrementalId(transaction || getPool(), 'THANHTOAN', 'MaThanhToan', 'TT', 3);
    const request = new sql.Request(transaction || getPool());
    request.input('maThanhToan', sql.VarChar, newId);
    request.input('maHopDong',   sql.VarChar, data.MaHopDong);
    request.input('maKH',        sql.VarChar, data.MaKH);
    request.input('soTien',      sql.Decimal(18, 0), data.SoTien);
    request.input('phuongThuc',  sql.VarChar, data.PhuongThuc);
    request.input('trangThai',   sql.VarChar, 'PENDING');
    request.input('noiDungCK',   sql.VarChar, data.NoiDungCK);
    request.input('ghiChu',      sql.NVarChar(500), data.GhiChu || null);

    const result = await request.query(`
        INSERT INTO dbo.THANHTOAN
            (MaThanhToan, MaHopDong, MaKH, SoTien, PhuongThuc, TrangThai, NoiDungCK, GhiChu)
        OUTPUT INSERTED.*
        VALUES
            (@maThanhToan, @maHopDong, @maKH, @soTien, @phuongThuc, @trangThai, @noiDungCK, @ghiChu)
    `);
    return result.recordset[0];
};

export const getPaymentById = async (id, transaction = null) => {
    const request = new sql.Request(transaction || getPool());
    request.input('id', sql.VarChar, id);
    const result = await request.query(BASE_SELECT + ` WHERE TT.MaThanhToan = @id`);
    return result.recordset[0];
};

export const getPaymentForUpdate = async (id, transaction) => {
    const request = new sql.Request(transaction || getPool());
    request.input('id', sql.VarChar, id);
    const result = await request.query(`
        SELECT
            TT.*,
            KH.TenKH, KH.Email, KH.DienThoai,
            HD.MaODat, HD.MaCayTrong, HD.NgayBatDau, HD.NgayKetThuc,
            HD.TongTien AS TongTienHopDong, HD.TrangThai AS TrangThaiHopDong,
            OD.TenODat, OD.DienTich,
            NT.TenNongTrai, NT.MaNongTrai
        FROM dbo.THANHTOAN TT WITH (UPDLOCK, ROWLOCK)
        JOIN dbo.KHACHHANG   KH ON TT.MaKH      = KH.MaKH
        JOIN dbo.HOPDONGTHUE HD ON TT.MaHopDong = HD.MaHopDong
        JOIN dbo.ODAT        OD ON HD.MaODat    = OD.MaODat
        JOIN dbo.NONGTRAI    NT ON OD.MaNongTrai = NT.MaNongTrai
        WHERE TT.MaThanhToan = @id
    `);
    return result.recordset[0];
};

export const getPaymentByContentOrOrder = async (content, transaction = null) => {
    const request = new sql.Request(transaction || getPool());
    request.input('content', sql.VarChar, `%${content}%`);
    const result = await request.query(BASE_SELECT + ` WHERE TT.NoiDungCK LIKE @content OR TT.MaThanhToan LIKE @content`);
    return result.recordset[0];
};

export const getPaymentsByContractId = async (maHopDong) => {
    const request = new sql.Request(getPool());
    request.input('maHopDong', sql.VarChar, maHopDong);
    const result = await request.query(BASE_SELECT + ` WHERE TT.MaHopDong = @maHopDong ORDER BY TT.CreatedAt DESC`);
    return result.recordset;
};

export const getPaymentsByCustomerId = async (maKH) => {
    const request = new sql.Request(getPool());
    request.input('maKH', sql.VarChar, maKH);
    const result = await request.query(BASE_SELECT + ` WHERE TT.MaKH = @maKH ORDER BY TT.CreatedAt DESC`);
    return result.recordset;
};

export const getAllPayments = async (filters = {}) => {
    const request = new sql.Request(getPool());
    const conditions = [];
    if (filters.trangThai) {
        request.input('trangThai', sql.VarChar, filters.trangThai);
        conditions.push('TT.TrangThai = @trangThai');
    }
    if (filters.phuongThuc) {
        request.input('phuongThuc', sql.VarChar, filters.phuongThuc);
        conditions.push('TT.PhuongThuc = @phuongThuc');
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await request.query(BASE_SELECT + ` ${where} ORDER BY TT.CreatedAt DESC`);
    return result.recordset;
};

export const updatePaymentStatus = async (id, trangThai, maGiaoDich, transaction, ghiChu = null) => {
    const request = new sql.Request(transaction || getPool());
    request.input('id',         sql.VarChar, id);
    request.input('trangThai',  sql.VarChar, trangThai);
    request.input('maGiaoDich', sql.VarChar, maGiaoDich || null);
    request.input('ghiChu',     sql.NVarChar(500), ghiChu);
    const result = await request.query(`
        UPDATE dbo.THANHTOAN
        SET TrangThai  = @trangThai,
            MaGiaoDich = COALESCE(@maGiaoDich, MaGiaoDich),
            GhiChu     = CASE WHEN @ghiChu IS NOT NULL THEN @ghiChu ELSE GhiChu END,
            UpdatedAt  = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE MaThanhToan = @id
    `);
    return result.recordset[0];
};