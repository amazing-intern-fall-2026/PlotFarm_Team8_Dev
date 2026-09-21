-- 009_create_farmer_applications.sql
-- Tao bang DON_DANGKY_NONGDAN (Farmer Partner Applications)
-- Ho tro xet duyet ho so Nong Dan voi day du thong tin ca nhan, CCCD 2 mat va trang thai PENDING
-- Idempotent: an toan khi chay lai nhieu lan

USE PlotFarmDB;
GO

IF OBJECT_ID(N'dbo.DON_DANGKY_NONGDAN', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DON_DANGKY_NONGDAN (
        MaDon             VARCHAR(20)      NOT NULL PRIMARY KEY,
        -- Thong tin ca nhan
        HoTen             NVARCHAR(200)    NOT NULL,
        NgaySinh          DATE             NULL,
        GioiTinh          NVARCHAR(10)     NULL,
        Email             VARCHAR(254)     NOT NULL,
        DienThoai         VARCHAR(15)      NOT NULL,
        DiaChi            NVARCHAR(500)    NOT NULL,

        -- Thong tin Can cuoc cong dan (CCCD)
        SoCCCD            VARCHAR(20)      NOT NULL,
        NgayCap           DATE             NULL,
        NoiCap            NVARCHAR(255)    NULL,
        AnhCCCDMatTruoc   NVARCHAR(MAX)    NULL, -- Base64 hoac URL anh chup mat truoc
        AnhCCCDMatSau     NVARCHAR(MAX)    NULL, -- Base64 hoac URL anh chup mat sau

        -- Thong tin chuyen mon & Tai khoan
        TenDangNhap       VARCHAR(50)      NOT NULL,
        MatKhauHash       VARCHAR(255)     NOT NULL,
        KinhNghiem        NVARCHAR(500)    NULL,

        -- Trang thai xet duyet: PENDING, APPROVED, REJECTED
        TrangThai         VARCHAR(20)      NOT NULL DEFAULT 'PENDING'
            CHECK (TrangThai IN ('PENDING', 'APPROVED', 'REJECTED')),
        LyDoTuChoi        NVARCHAR(500)    NULL,
        NgayDangKy        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        NgayXuLy          DATETIME2        NULL,
        NguoiXuLy         VARCHAR(50)      NULL
    );
    PRINT 'Tao bang DON_DANGKY_NONGDAN thanh cong.';
END
ELSE
BEGIN
    PRINT 'Bang DON_DANGKY_NONGDAN da ton tai, bo qua tao moi.';
END
GO

-- Indexes toi uu tim kiem & tra cuu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DON_DANGKY_TrangThai' AND object_id = OBJECT_ID('dbo.DON_DANGKY_NONGDAN'))
    CREATE INDEX IX_DON_DANGKY_TrangThai ON dbo.DON_DANGKY_NONGDAN(TrangThai);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DON_DANGKY_TenDangNhap' AND object_id = OBJECT_ID('dbo.DON_DANGKY_NONGDAN'))
    CREATE INDEX IX_DON_DANGKY_TenDangNhap ON dbo.DON_DANGKY_NONGDAN(TenDangNhap);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DON_DANGKY_SoCCCD' AND object_id = OBJECT_ID('dbo.DON_DANGKY_NONGDAN'))
    CREATE INDEX IX_DON_DANGKY_SoCCCD ON dbo.DON_DANGKY_NONGDAN(SoCCCD);
GO

PRINT 'Migration 009_create_farmer_applications.sql hoan tat.';
GO
