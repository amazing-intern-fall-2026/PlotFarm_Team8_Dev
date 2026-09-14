import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

// ─── Original Functions ───────────────────────────────────────────────────────

export const checkPlotAvailability = async (maODat, transaction) => {
    const request = new sql.Request(transaction || getPool());
    request.input('maODat', sql.VarChar, maODat);
    const result = await request.query(`
        SELECT MaODat, GiaThue, TrangThai 
        FROM dbo.ODAT WITH (UPDLOCK, HOLDLOCK)
        WHERE MaODat = @maODat
    `);
    return result.recordset[0];
};

export const checkCropExists = async (maCayTrong, transaction) => {
    const request = new sql.Request(transaction || getPool());
    request.input('maCayTrong', sql.VarChar, maCayTrong);
    const result = await request.query(`
        SELECT MaCayTrong, ThoiGianThuHoach
        FROM dbo.CAYTRONG
        WHERE MaCayTrong = @maCayTrong
    `);
    return result.recordset[0];
};

export const updatePlotStatus = async (maODat, trangThai, transaction) => {
    const request = new sql.Request(transaction || getPool());
    request.input('maODat', sql.VarChar, maODat);
    request.input('trangThai', sql.VarChar, trangThai);
    
    let query = `
        UPDATE dbo.ODAT
        SET TrangThai = @trangThai, UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE MaODat = @maODat
    `;
    if (trangThai === 'DANG_THUE') {
        query += ` AND TrangThai = 'TRONG'`;
    }

    const result = await request.query(query);
    return result.recordset[0];
};

export const createContract = async (contractData, transaction) => {
    const newMaHopDong = await generateIncrementalId(transaction || getPool(), 'HOPDONGTHUE', 'MaHopDong', 'HD', 3);
    
    const request = new sql.Request(transaction || getPool());
    const query = `
        INSERT INTO dbo.HOPDONGTHUE 
            (MaHopDong, MaKH, MaODat, MaCayTrong, NgayBatDau, NgayKetThuc, TongTien, TrangThai)
        OUTPUT INSERTED.*
        VALUES 
            (@maHopDong, @maKH, @maODat, @maCayTrong, @ngayBatDau, @ngayKetThuc, @tongTien, @trangThai)
    `;
    
    request.input('maHopDong', sql.VarChar, newMaHopDong);
    request.input('maKH', sql.VarChar, contractData.MaKH);
    request.input('maODat', sql.VarChar, contractData.MaODat);
    request.input('maCayTrong', sql.VarChar, contractData.MaCayTrong);
    request.input('ngayBatDau', sql.Date, contractData.NgayBatDau);
    request.input('ngayKetThuc', sql.Date, contractData.NgayKetThuc);
    request.input('tongTien', sql.Decimal(18,0), contractData.TongTien);
    request.input('trangThai', sql.VarChar, 'ACTIVE');
    
    const result = await request.query(query);
    return result.recordset[0];
};

// ─── Extended Functions ───────────────────────────────────────────────────────

// Build the base SELECT with full JOINs (reused across multiple queries)
const BASE_SELECT = `
    SELECT
        HD.*,
        KH.TenKH, KH.Email, KH.DienThoai,
        OD.TenODat, OD.DienTich,
        NT.TenNongTrai, NT.DiaChi AS DiaChiNongTrai, NT.MaChuNongTrai,
        CT.TenCayTrong, CT.LoaiCay, CT.ThoiGianThuHoach
    FROM dbo.HOPDONGTHUE HD
    JOIN dbo.KHACHHANG   KH ON HD.MaKH       = KH.MaKH
    JOIN dbo.ODAT        OD ON HD.MaODat      = OD.MaODat
    JOIN dbo.NONGTRAI    NT ON OD.MaNongTrai  = NT.MaNongTrai
    JOIN dbo.CAYTRONG    CT ON HD.MaCayTrong  = CT.MaCayTrong
`;

// Get all contracts with optional TrangThai/Farmer/Farm filter
export const getAllContracts = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);

    const conditions = [];
    if (filters.trangThai) {
        request.input('trangThai', sql.VarChar, filters.trangThai);
        conditions.push('HD.TrangThai = @trangThai');
    }
    if (filters.farmerId) {
        request.input('farmerId', sql.VarChar, filters.farmerId);
        conditions.push('NT.MaChuNongTrai = @farmerId');
    }
    if (filters.farmId) {
        request.input('farmId', sql.VarChar, filters.farmId);
        conditions.push('OD.MaNongTrai = @farmId');
    }
    if (filters.customerId) {
        request.input('customerId', sql.VarChar, filters.customerId);
        conditions.push('HD.MaKH = @customerId');
    }


    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await request.query(`
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY HD.CreatedAt DESC
    `);
    return result.recordset;
};

// Get contracts belonging to a specific customer
export const getContractsByCustomerId = async (maKH) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('maKH', sql.VarChar, maKH);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE HD.MaKH = @maKH
        ORDER BY HD.CreatedAt DESC
    `);
    return result.recordset;
};

// Get a single contract by ID
export const getContractById = async (id) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('id', sql.VarChar, id);

    const result = await request.query(`
        ${BASE_SELECT}
        WHERE HD.MaHopDong = @id
    `);
    return result.recordset[0];
};

// Update contract status; if CANCELLED or COMPLETED also free the plot
export const updateContractStatus = async (id, trangThai, transaction = null) => {
    const target = transaction || getPool();

    // Update contract status
    const contractRequest = new sql.Request(target);
    contractRequest.input('id', sql.VarChar, id);
    contractRequest.input('trangThai', sql.VarChar, trangThai);
    const result = await contractRequest.query(`
        UPDATE dbo.HOPDONGTHUE
        SET TrangThai = @trangThai, UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE MaHopDong = @id
    `);

    const updated = result.recordset[0];

    // Free the plot when contract ends
    if (updated && (trangThai === 'CANCELLED' || trangThai === 'COMPLETED')) {
        const plotRequest = new sql.Request(target);
        plotRequest.input('maODat', sql.VarChar, updated.MaODat);
        await plotRequest.query(`
            UPDATE dbo.ODAT
            SET TrangThai = 'TRONG', UpdatedAt = SYSUTCDATETIME()
            WHERE MaODat = @maODat
        `);
    }

    return updated;
};
