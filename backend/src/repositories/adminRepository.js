import sql from 'mssql';
import { getPool } from '../config/database.js';

export const getKPIStats = async () => {
    const pool = getPool();
    const request = new sql.Request(pool);

    const query = `
        SELECT
            (SELECT COUNT(*) FROM dbo.NONGTRAI) AS totalFarms,
            (SELECT COUNT(*) FROM dbo.ODAT) AS totalPlots,
            (SELECT COUNT(*) FROM dbo.ODAT WHERE TrangThai = 'TRONG') AS availablePlots,
            (SELECT COUNT(*) FROM dbo.ODAT WHERE TrangThai = 'DANG_THUE') AS rentedPlots,
            (SELECT ISNULL(SUM(TongTien), 0) FROM dbo.HOPDONGTHUE WHERE TrangThai IN ('ACTIVE', 'COMPLETED')) AS totalRevenue,
            (SELECT COUNT(*) FROM dbo.YEUCAUCHAMSOC WHERE TrangThai = 'PENDING') AS pendingCareRequests,
            (SELECT COUNT(*) FROM dbo.HOPDONGTHUE WHERE TrangThai = 'ACTIVE' AND NgayKetThuc BETWEEN CAST(SYSUTCDATETIME() AS DATE) AND DATEADD(day, 30, CAST(SYSUTCDATETIME() AS DATE))) AS expiringContractsCount
    `;

    const result = await request.query(query);
    return result.recordset[0];
};

export const getAllUsers = async (filters = {}) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    const conditions = [];

    if (filters.role) {
        request.input('role', sql.VarChar, filters.role.toUpperCase());
        conditions.push('TK.MaVaiTro = @role');
    }

    if (filters.status) {
        request.input('status', sql.VarChar, filters.status.toUpperCase());
        conditions.push('COALESCE(KH.TrangThai, NV.TrangThai) = @status');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
        SELECT
            TK.TenDangNhap AS username,
            TK.MaVaiTro AS role,
            COALESCE(KH.MaKH, NV.MaNV) AS id,
            COALESCE(KH.TenKH, NV.Ho + ' ' + NV.Ten) AS fullName,
            COALESCE(KH.Email, NV.Email) AS email,
            COALESCE(KH.DienThoai, NV.DienThoai) AS phone,
            COALESCE(KH.TrangThai, NV.TrangThai) AS status,
            COALESCE(KH.CreatedAt, NV.CreatedAt) AS createdAt
        FROM dbo.TAIKHOAN TK
        LEFT JOIN dbo.KHACHHANG KH ON TK.MaKH = KH.MaKH
        LEFT JOIN dbo.NHANVIEN NV ON TK.MaNV = NV.MaNV
        ${whereClause}
        ORDER BY COALESCE(KH.CreatedAt, NV.CreatedAt) DESC
    `;

    const result = await request.query(query);
    return result.recordset;
};

export const findUserByIdOrUsername = async (idOrUsername) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('idOrUsername', sql.VarChar, idOrUsername);

    const query = `
        SELECT
            TK.TenDangNhap AS username,
            TK.MaVaiTro AS role,
            TK.MaKH,
            TK.MaNV,
            COALESCE(KH.MaKH, NV.MaNV) AS id,
            COALESCE(KH.TenKH, NV.Ho + ' ' + NV.Ten) AS fullName,
            COALESCE(KH.Email, NV.Email) AS email,
            COALESCE(KH.DienThoai, NV.DienThoai) AS phone,
            COALESCE(KH.TrangThai, NV.TrangThai) AS status
        FROM dbo.TAIKHOAN TK
        LEFT JOIN dbo.KHACHHANG KH ON TK.MaKH = KH.MaKH
        LEFT JOIN dbo.NHANVIEN NV ON TK.MaNV = NV.MaNV
        WHERE TK.TenDangNhap = @idOrUsername OR KH.MaKH = @idOrUsername OR NV.MaNV = @idOrUsername
    `;

    const result = await request.query(query);
    return result.recordset[0];
};

export const updateUserStatus = async (userRecord, newStatus) => {
    const pool = getPool();
    const request = new sql.Request(pool);
    request.input('status', sql.VarChar, newStatus);

    if (userRecord.MaKH) {
        request.input('maKH', sql.VarChar, userRecord.MaKH);
        const result = await request.query(`
            UPDATE dbo.KHACHHANG
            SET TrangThai = @status, UpdatedAt = SYSUTCDATETIME()
            OUTPUT
                INSERTED.MaKH AS id,
                INSERTED.TenKH AS fullName,
                INSERTED.Email AS email,
                INSERTED.DienThoai AS phone,
                INSERTED.TrangThai AS status
            WHERE MaKH = @maKH
        `);
        return {
            ...result.recordset[0],
            username: userRecord.username,
            role: userRecord.role,
        };
    } else if (userRecord.MaNV) {
        request.input('maNV', sql.VarChar, userRecord.MaNV);
        const result = await request.query(`
            UPDATE dbo.NHANVIEN
            SET TrangThai = @status, UpdatedAt = SYSUTCDATETIME()
            OUTPUT
                INSERTED.MaNV AS id,
                INSERTED.Ho + ' ' + INSERTED.Ten AS fullName,
                INSERTED.Email AS email,
                INSERTED.DienThoai AS phone,
                INSERTED.TrangThai AS status
            WHERE MaNV = @maNV
        `);
        return {
            ...result.recordset[0],
            username: userRecord.username,
            role: userRecord.role,
        };
    }

    return null;
};
