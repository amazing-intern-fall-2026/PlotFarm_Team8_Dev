-- 003_create_indexes.sql
-- Indexes for foreign keys and filtered unique indexes

-- Indexes for foreign keys
CREATE INDEX IX_TAIKHOAN_VAITRO ON dbo.TAIKHOAN (MaVaiTro);
CREATE INDEX IX_TAIKHOAN_KHACHHANG ON dbo.TAIKHOAN (MaKH);
CREATE INDEX IX_TAIKHOAN_NHANVIEN ON dbo.TAIKHOAN (MaNV);
CREATE INDEX IX_NONGTRAI_CHUNONGTRAI ON dbo.NONGTRAI (MaChuNongTrai);

-- Filtered unique indexes (example for nullable columns)
-- Assuming MaVanDon is nullable in THONGBAO (not defined here), example syntax:
-- CREATE UNIQUE INDEX IX_THONGBAO_MaVanDon ON dbo.THONGBAO (MaVanDon) WHERE MaVanDon IS NOT NULL;

-- Additional indexes for commonly queried columns can be added as needed.
