-- 008_add_payment_table.sql
-- Them bang THANHTOAN (Payment) va cap nhat HOPDONGTHUE de ho tro trang thai PENDING
-- Idempotent: an toan khi chay lai nhieu lan

USE PlotFarmDB;
GO

-- 1. Alter HOPDONGTHUE: them trang thai PENDING
DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
WHERE OBJECT_NAME(cc.parent_object_id) = 'HOPDONGTHUE'
  AND c.name = 'TrangThai';

IF @constraintName IS NOT NULL
    EXEC('ALTER TABLE dbo.HOPDONGTHUE DROP CONSTRAINT ' + @constraintName);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints cc
    JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
    WHERE OBJECT_NAME(cc.parent_object_id) = 'HOPDONGTHUE'
      AND c.name = 'TrangThai'
      AND cc.definition LIKE '%PENDING%'
)
BEGIN
    ALTER TABLE dbo.HOPDONGTHUE
    ADD CONSTRAINT CK_HOPDONGTHUE_TrangThai
    CHECK (TrangThai IN (N'PENDING', N'ACTIVE', N'COMPLETED', N'CANCELLED'));
    PRINT 'Da cap nhat constraint TrangThai cho HOPDONGTHUE.';
END
GO

-- 2. Tao bang THANHTOAN
IF OBJECT_ID(N'dbo.THANHTOAN', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.THANHTOAN (
        MaThanhToan  VARCHAR(20)      NOT NULL PRIMARY KEY,
        MaHopDong    VARCHAR(20)      NOT NULL,
        MaKH         VARCHAR(20)      NOT NULL,
        SoTien       DECIMAL(18,0)    NOT NULL,
        PhuongThuc   VARCHAR(20)      NOT NULL CHECK (PhuongThuc IN (N'VIETQR', N'VNPAY', N'MOMO')),
        TrangThai    VARCHAR(20)      NOT NULL CHECK (TrangThai IN (N'PENDING', N'COMPLETED', N'FAILED', N'REFUNDED')),
        MaGiaoDich   VARCHAR(100)     NULL,
        NoiDungCK    VARCHAR(100)     NOT NULL,
        GhiChu       NVARCHAR(500)    NULL,
        CreatedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2        NULL,
        CONSTRAINT FK_THANHTOAN_HOPDONG    FOREIGN KEY (MaHopDong) REFERENCES dbo.HOPDONGTHUE(MaHopDong),
        CONSTRAINT FK_THANHTOAN_KHACHHANG  FOREIGN KEY (MaKH)      REFERENCES dbo.KHACHHANG(MaKH)
    );
    PRINT 'Tao bang THANHTOAN thanh cong.';
END
ELSE
    PRINT 'Bang THANHTOAN da ton tai, bo qua.';
GO

-- 3. Index toi uu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_THANHTOAN_MaHopDong' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
    CREATE INDEX IX_THANHTOAN_MaHopDong ON dbo.THANHTOAN(MaHopDong);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_THANHTOAN_MaKH' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
    CREATE INDEX IX_THANHTOAN_MaKH ON dbo.THANHTOAN(MaKH);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_THANHTOAN_TrangThai' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
    CREATE INDEX IX_THANHTOAN_TrangThai ON dbo.THANHTOAN(TrangThai);
GO

PRINT 'Migration 008_add_payment_table.sql hoan tat.';
GO
