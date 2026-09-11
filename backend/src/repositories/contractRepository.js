import sql from 'mssql';
import { getPool } from '../config/database.js';
import { generateIncrementalId } from '../utils/idGenerator.js';

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
    await request.query(`
        UPDATE dbo.ODAT
        SET TrangThai = @trangThai, UpdatedAt = SYSUTCDATETIME()
        WHERE MaODat = @maODat
    `);
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
