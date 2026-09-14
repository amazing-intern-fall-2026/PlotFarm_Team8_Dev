-- 007_seed_full_ecosystem.sql
-- Comprehensive Seed Data for PlotFarm Platform (Customers, Contracts, Logs, Requests, Harvests)
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Customers (KHACHHANG)
    IF NOT EXISTS (SELECT 1 FROM dbo.KHACHHANG WHERE MaKH = 'KH001')
        INSERT INTO dbo.KHACHHANG (MaKH, TenKH, Email, DienThoai, DiaChi, TrangThai)
        VALUES ('KH001', N'Nguyễn Văn Nông', 'customer@plotfarm.com', '0912345678', N'123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 'ACTIVE');

    IF NOT EXISTS (SELECT 1 FROM dbo.KHACHHANG WHERE MaKH = 'KH002')
        INSERT INTO dbo.KHACHHANG (MaKH, TenKH, Email, DienThoai, DiaChi, TrangThai)
        VALUES ('KH002', N'Trần Thị Mai', 'customer2@plotfarm.com', '0918765432', N'456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', 'ACTIVE');

    -- 2. Customer Accounts (TAIKHOAN) - Password: customer123
    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'customer')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
        VALUES ('customer', '$2b$10$rTfJvXN8BtOtLo8/xNq5ZuaUpDxpdnngN52ZwLvi0fFi3CQuiuSuS', 'CUSTOMER', 'KH001');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'customer1')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
        VALUES ('customer1', '$2b$10$rTfJvXN8BtOtLo8/xNq5ZuaUpDxpdnngN52ZwLvi0fFi3CQuiuSuS', 'CUSTOMER', 'KH001');

    IF NOT EXISTS (SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap = 'customer2')
        INSERT INTO dbo.TAIKHOAN (TenDangNhap, MatKhauHash, MaVaiTro, MaKH)
        VALUES ('customer2', '$2b$10$rTfJvXN8BtOtLo8/xNq5ZuaUpDxpdnngN52ZwLvi0fFi3CQuiuSuS', 'CUSTOMER', 'KH002');

    -- 3. Update Plots to Rented for seeded contracts (OD001 & OD002)
    UPDATE dbo.ODAT SET TrangThai = 'DANG_THUE' WHERE MaODat IN ('OD001', 'OD002');
    UPDATE dbo.ODAT SET TrangThai = 'TRONG' WHERE MaODat NOT IN ('OD001', 'OD002');

    -- 4. Contracts (HOPDONGTHUE)
    -- Contract 1: Active rental for OD001 (Cà chua bi)
    IF NOT EXISTS (SELECT 1 FROM dbo.HOPDONGTHUE WHERE MaHopDong = 'HD001')
        INSERT INTO dbo.HOPDONGTHUE 
            (MaHopDong, MaKH, MaODat, MaCayTrong, NgayBatDau, NgayKetThuc, TongTien, TrangThai)
        VALUES 
            ('HD001', 'KH001', 'OD001', 'CT001', '2026-01-15', '2026-07-15', 18000000, 'ACTIVE');

    -- Contract 2: Active rental for OD002 (Dưa lưới)
    IF NOT EXISTS (SELECT 1 FROM dbo.HOPDONGTHUE WHERE MaHopDong = 'HD002')
        INSERT INTO dbo.HOPDONGTHUE 
            (MaHopDong, MaKH, MaODat, MaCayTrong, NgayBatDau, NgayKetThuc, TongTien, TrangThai)
        VALUES 
            ('HD002', 'KH001', 'OD002', 'CT002', '2026-02-01', '2026-08-01', 21000000, 'ACTIVE');

    -- Contract 3: Completed contract for customer KH002
    IF NOT EXISTS (SELECT 1 FROM dbo.HOPDONGTHUE WHERE MaHopDong = 'HD003')
        INSERT INTO dbo.HOPDONGTHUE 
            (MaHopDong, MaKH, MaODat, MaCayTrong, NgayBatDau, NgayKetThuc, TongTien, TrangThai)
        VALUES 
            ('HD003', 'KH002', 'OD003', 'CT003', '2025-06-01', '2025-12-01', 24000000, 'COMPLETED');

    -- 5. Farming Logs (NHATKYCANHTAC) for HD001 (Progress progression: 30% -> 55% -> 80% -> 95%)
    IF NOT EXISTS (SELECT 1 FROM dbo.NHATKYCANHTAC WHERE MaNhatKy = 'NK001')
        INSERT INTO dbo.NHATKYCANHTAC 
            (MaNhatKy, MaHopDong, MaODat, NgayGhi, HoatDong, GiaiDoanCay, TienDoPhanTram, MoTa, HinhAnhMinhChung, NguoiGhi)
        VALUES 
            ('NK001', 'HD001', 'OD001', '2026-01-20 08:30:00', N'Gieo hạt mầm & Tạo luống', N'Nảy mầm', 20, 
             N'Gieo 1.200 hạt giống cà chua bi F1 thuần chủng trên luống đất đã xử lý vôi và trùn quế.', 
             'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80', 'NV001');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHATKYCANHTAC WHERE MaNhatKy = 'NK002')
        INSERT INTO dbo.NHATKYCANHTAC 
            (MaNhatKy, MaHopDong, MaODat, NgayGhi, HoatDong, GiaiDoanCay, TienDoPhanTram, MoTa, HinhAnhMinhChung, NguoiGhi)
        VALUES 
            ('NK002', 'HD001', 'OD001', '2026-02-10 09:00:00', N'Bón phân hữu cơ vi sinh & Vun gốc', N'Phát triển thân lá', 45, 
             N'Bón bổ sung 50kg phân vi sinh Trichoderma, hệ rễ phát triển cực mạnh, thân cây cứng cáp.', 
             'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa97?w=600&auto=format&fit=crop&q=80', 'NV001');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHATKYCANHTAC WHERE MaNhatKy = 'NK003')
        INSERT INTO dbo.NHATKYCANHTAC 
            (MaNhatKy, MaHopDong, MaODat, NgayGhi, HoatDong, GiaiDoanCay, TienDoPhanTram, MoTa, HinhAnhMinhChung, NguoiGhi)
        VALUES 
            ('NK003', 'HD001', 'OD001', '2026-02-28 10:15:00', N'Tỉa nhánh phụ & Thụ phấn hoa', N'Đang ra hoa', 75, 
             N'Tiến hành thụ phấn nhân tạo kết hợp ong mật. Cây ra chùm hoa đều, tỷ lệ đậu quả ước tính đạt trên 92%.', 
             'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80', 'NV001');

    IF NOT EXISTS (SELECT 1 FROM dbo.NHATKYCANHTAC WHERE MaNhatKy = 'NK004')
        INSERT INTO dbo.NHATKYCANHTAC 
            (MaNhatKy, MaHopDong, MaODat, NgayGhi, HoatDong, GiaiDoanCay, TienDoPhanTram, MoTa, HinhAnhMinhChung, NguoiGhi)
        VALUES 
            ('NK004', 'HD001', 'OD001', '2026-03-14 07:45:00', N'Kiểm tra độ đường Brix & Bao trái', N'Chuẩn bị thu hoạch', 90, 
             N'Trái cà chua bắt đầu ngả đỏ đều, độ ngọt Brix đo thực tế đạt 9.2, dự kiến có thể thu hoạch đợt 1 sau 5 ngày.', 
             'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80', 'NV001');

    -- 6. Care Requests (YEUCAUCHAMSOC)
    -- Request 1: Completed
    IF NOT EXISTS (SELECT 1 FROM dbo.YEUCAUCHAMSOC WHERE MaYeuCau = 'YC001')
        INSERT INTO dbo.YEUCAUCHAMSOC 
            (MaYeuCau, MaHopDong, MaKH, LoaiYeuCau, MoTa, TrangThai, GhiChuPhanHoi, HinhAnhKetQua, CreatedAt, CompletedAt)
        VALUES 
            ('YC001', 'HD001', 'KH001', N'Tưới nước bổ sung', N'Thời tiết hôm nay nắng nóng, nhờ bác nông dân tưới bổ sung thêm một cữ lúc 16h chiều.', 'COMPLETED', 
             N'Đã bật hệ thống tưới nhỏ giọt tự động 30 phút lúc 16h00. Độ ẩm đất đã đạt ngưỡng tối ưu 72%.', 
             'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80', '2026-03-10 14:00:00', '2026-03-10 16:45:00');

    -- Request 2: In Progress
    IF NOT EXISTS (SELECT 1 FROM dbo.YEUCAUCHAMSOC WHERE MaYeuCau = 'YC002')
        INSERT INTO dbo.YEUCAUCHAMSOC 
            (MaYeuCau, MaHopDong, MaKH, LoaiYeuCau, MoTa, TrangThai, GhiChuPhanHoi, CreatedAt)
        VALUES 
            ('YC002', 'HD001', 'KH001', N'Bắt sâu & Kiểm tra lá', N'Nhìn qua camera thấy có một số lá ở góc phía đông bị quăn mép, nhờ kiểm tra sâu vẽ bùa.', 'IN_PROGRESS', 
             N'Kỹ sư đã nhận việc, đang dùng chế phẩm thảo mộc xịt phòng ngừa sinh học lúc sáng sớm.', '2026-03-13 18:30:00');

    -- Request 3: Pending
    IF NOT EXISTS (SELECT 1 FROM dbo.YEUCAUCHAMSOC WHERE MaYeuCau = 'YC003')
        INSERT INTO dbo.YEUCAUCHAMSOC 
            (MaYeuCau, MaHopDong, MaKH, LoaiYeuCau, MoTa, TrangThai, CreatedAt)
        VALUES 
            ('YC003', 'HD002', 'KH001', N'Bón phân hữu cơ vi sinh', N'Đến kỳ bón thúc đợt 2 cho giàn dưa lưới, nhờ nông trại thực hiện đúng lịch VietGAP.', 'PENDING', '2026-03-14 11:00:00');

    -- 7. Harvest & Delivery (THUHOACH)
    -- Harvest 1: Packed & Ready for delivery (HD001)
    IF NOT EXISTS (SELECT 1 FROM dbo.THUHOACH WHERE MaThuHoach = 'TH001')
        INSERT INTO dbo.THUHOACH 
            (MaThuHoach, MaHopDong, NgayThuHoachDuKien, NgayThuHoachThucTe, SanLuongDuKien, SanLuongThucTe, 
             TrangThaiThuHoach, TrangThaiDongGoi, TrangThaiGiaoHang, DiaChiGiaoHang, MaVanDon, GhiChu)
        VALUES 
            ('TH001', 'HD001', '2026-03-18', '2026-03-18', '50 kg', '53.5 kg', 
             'HARVESTED', 'PACKED', 'DELIVERING', N'123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 
             'VNPOST-PF992831', N'Cà chua bi trái đều mọng nước, đóng 10 thùng carton đục lỗ bảo quản chuẩn lạnh.');

    -- Harvest 2: Scheduled upcoming harvest (HD002)
    IF NOT EXISTS (SELECT 1 FROM dbo.THUHOACH WHERE MaThuHoach = 'TH002')
        INSERT INTO dbo.THUHOACH 
            (MaThuHoach, MaHopDong, NgayThuHoachDuKien, SanLuongDuKien, 
             TrangThaiThuHoach, TrangThaiDongGoi, TrangThaiGiaoHang, DiaChiGiaoHang, GhiChu)
        VALUES 
            ('TH002', 'HD002', '2026-04-20', '80 kg', 
             'SCHEDULED', 'NOT_PACKED', 'WAITING_PICKUP', N'123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 
             N'Dưa lưới ruột cam chuẩn bị đón đợt thu hoạch đầu vụ.');

    -- Harvest 3: Delivered past harvest (HD003)
    IF NOT EXISTS (SELECT 1 FROM dbo.THUHOACH WHERE MaThuHoach = 'TH003')
        INSERT INTO dbo.THUHOACH 
            (MaThuHoach, MaHopDong, NgayThuHoachDuKien, NgayThuHoachThucTe, SanLuongDuKien, SanLuongThucTe, 
             TrangThaiThuHoach, TrangThaiDongGoi, TrangThaiGiaoHang, DiaChiGiaoHang, MaVanDon, GhiChu)
        VALUES 
            ('TH003', 'HD003', '2025-11-20', '2025-11-20', '40 kg', '42 kg', 
             'HARVESTED', 'PACKED', 'DELIVERED', N'456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', 
             'VNPOST-PF881120', N'Đã giao tận tay khách hàng thành công.');

    COMMIT TRANSACTION;
    PRINT N'>>> PlotFarm Ecosystem Seed Completed Successfully! <<<';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    PRINT N'Error during seeding: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
