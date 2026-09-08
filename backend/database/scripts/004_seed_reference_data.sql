-- 004_seed_reference_data.sql
-- Seed reference data for PlotFarm

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- Idempotent insert for roles (VAITRO)
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE MaVaiTro = N'CUSTOMER')
        INSERT INTO dbo.VAITRO (MaVaiTro, TenVaiTro, MoTa)
        VALUES (N'CUSTOMER', N'Customer', N'Customer role');

    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE MaVaiTro = N'FARMER')
        INSERT INTO dbo.VAITRO (MaVaiTro, TenVaiTro, MoTa)
        VALUES (N'FARMER', N'Farmer', N'Farmer role');

    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE MaVaiTro = N'ADMIN')
        INSERT INTO dbo.VAITRO (MaVaiTro, TenVaiTro, MoTa)
        VALUES (N'ADMIN', N'Admin', N'Administrator role');

    -- No TrangThai table exists; removed invalid inserts.

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Additional seed data for other lookup tables can be added here.
