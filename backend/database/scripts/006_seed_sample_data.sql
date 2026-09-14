-- 006_seed_sample_data.sql
-- Seed standard Employees, Farms, Crops, and Plots into PlotFarmDB
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Employees (NHANVIEN)
    IF NOT EXISTS (SELECT 1 FROM dbo.NHANVIEN WHERE MaNV = 'NV001')
        INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
        VALUES ('NV001', N'Lê Văn', N'Canh Tác', 'farmer@plotfarm.com', '0901234567', 'FARMER', 'ACTIVE');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHANVIEN WHERE MaNV = 'NV002')
        INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
        VALUES ('NV002', N'Nguyễn Thị', N'Đồng Ruộng', 'farmer2@plotfarm.com', '0902345678', 'FARMER', 'ACTIVE');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHANVIEN WHERE MaNV = 'NV003')
        INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
        VALUES ('NV003', N'Trần Văn', N'Vườn', 'farmer3@plotfarm.com', '0903456789', 'FARMER', 'ACTIVE');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHANVIEN WHERE MaNV = 'NV010')
        INSERT INTO dbo.NHANVIEN (MaNV, Ho, Ten, Email, DienThoai, ChucVu, TrangThai)
        VALUES ('NV010', N'Trần', N'Quản Trị', 'admin@plotfarm.com', '0909999999', 'ADMIN', 'ACTIVE');

    -- 2. Accounts (TAIKHOAN) - Password: Password123 ($2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa)
    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'farmer')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
        VALUES ('farmer', '$2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa', 'FARMER', 'NV001');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'farmer1')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
        VALUES ('farmer1', '$2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa', 'FARMER', 'NV001');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'farmer2')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
        VALUES ('farmer2', '$2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa', 'FARMER', 'NV002');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'farmer3')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
        VALUES ('farmer3', '$2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa', 'FARMER', 'NV003');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'admin')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaNV)
        VALUES ('admin', '$2b$10$TnxNealf5BIF.MsCkOkhUee5lFbfwH3CXT01kLQ9SMs4dVKeUeWTa', 'ADMIN', 'NV010');

    -- 3. Crops (CAYTRONG)
    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT001')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT001', N'Cà chua bi hữu cơ', N'Rau ăn quả', 45);

    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT002')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT002', N'Dưa lưới nhà màng', N'Trái cây', 75);

    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT003')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT003', N'Dâu tây New Zealand', N'Trái cây ôn đới', 90);

    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT004')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT004', N'Cải xoăn Kale hữu cơ', N'Rau ăn lá', 30);

    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT005')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT005', N'Xà lách thủy canh Carol', N'Rau ăn lá', 25);

    IF NOT EXISTS (SELECT 1 FROM dbo.CAYTRONG WHERE MaCayTrong = 'CT006')
        INSERT INTO dbo.CAYTRONG (MaCayTrong, TenCayTrong, LoaiCay, ThoiGianThuHoach)
        VALUES ('CT006', N'Ớt chuông Sweet Pepper', N'Rau ăn quả', 60);

    -- 4. Farms (NONGTRAI)
    IF NOT EXISTS (SELECT 1 FROM dbo.NONGTRAI WHERE MaNongTrai = 'NT001')
        INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
        VALUES ('NT001', N'Nông trại Thung Lũng Xanh (Lâm Đồng)', 'NV001', N'Đức Trọng, Lâm Đồng', 'APPROVED');

    IF NOT EXISTS (SELECT 1 FROM dbo.NONGTRAI WHERE MaNongTrai = 'NT002')
        INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
        VALUES ('NT002', N'Nông trại Sinh Thái Sông Cầu (Bắc Giang)', 'NV001', N'Việt Yên, Bắc Giang', 'APPROVED');

    IF NOT EXISTS (SELECT 1 FROM dbo.NONGTRAI WHERE MaNongTrai = 'NT003')
        INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
        VALUES ('NT003', N'Nông trại Rau Sạch Củ Chi (TP.HCM)', 'NV002', N'Tân Phú Trung, Củ Chi, TP.HCM', 'APPROVED');

    IF NOT EXISTS (SELECT 1 FROM dbo.NONGTRAI WHERE MaNongTrai = 'NT004')
        INSERT INTO dbo.NONGTRAI (MaNongTrai, TenNongTrai, MaChuNongTrai, DiaChi, TrangThai)
        VALUES ('NT004', N'Nông trại Công Nghệ Cao Mê Kông (Tiền Giang)', 'NV003', N'Cái Bè, Tiền Giang', 'APPROVED');

    -- 5. Plots (ODAT)
    -- NT001 (Lâm Đồng)
    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD001')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD001', 'NT001', N'Thửa #A1 - Cà Chua Bi & Dâu Tây', 500, 'TRONG', 3000000, 'https://example.com/cam1', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80', 68.5, 24.2, 6.4, 15000);

    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD002')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD002', 'NT001', N'Thửa #A2 - Dưa Lưới Israel', 600, 'TRONG', 3500000, 'https://example.com/cam2', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80', 65.0, 25.0, 6.5, 18000);

    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD003')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD003', 'NT001', N'Thửa #A3 - Dâu Tây Hữu Cơ', 450, 'TRONG', 4000000, 'https://example.com/cam3', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80', 70.0, 22.8, 6.2, 14000);

    -- NT002 (Bắc Giang)
    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD004')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD004', 'NT002', N'Thửa #B1 - Cải Kale & Xà Lách', 400, 'TRONG', 2500000, 'https://example.com/cam4', 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa97?w=600&auto=format&fit=crop&q=80', 62.0, 27.5, 6.8, 20000);

    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD005')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD005', 'NT002', N'Thửa #B2 - Rau Hữu Cơ Tổng Hợp', 550, 'TRONG', 2800000, 'https://example.com/cam5', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80', 64.0, 28.0, 6.6, 19000);

    -- NT003 (Củ Chi)
    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD006')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD006', 'NT003', N'Thửa #C1 - Dưa Lưới & Ớt Chuông', 700, 'TRONG', 3800000, 'https://example.com/cam6', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80', 66.0, 29.5, 6.3, 22000);

    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD007')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD007', 'NT003', N'Thửa #C2 - Cà Chua Bi Nhà Màng', 500, 'TRONG', 3200000, 'https://example.com/cam7', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80', 67.5, 29.0, 6.5, 21000);

    -- NT004 (Tiền Giang)
    IF NOT EXISTS (SELECT 1 FROM dbo.ODAT WHERE MaODat = 'OD008')
        INSERT INTO dbo.ODAT (MaODat, MaNongTrai, TenODat, DienTich, TrangThai, GiaThue, CameraUrl, HinhAnhThumbnail, DoAmDat, NhietDo, DoPH, AnhSangLux)
        VALUES ('OD008', 'NT004', N'Thửa #D1 - Rau Thủy Canh Mê Kông', 800, 'TRONG', 4200000, 'https://example.com/cam8', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80', 72.0, 30.0, 6.7, 23000);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
