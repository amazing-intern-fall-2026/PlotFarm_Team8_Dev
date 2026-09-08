-- 001_create_database.sql
-- Create PlotFarmDB if it does not exist
IF DB_ID(N'PlotFarmDB') IS NULL
BEGIN
    CREATE DATABASE PlotFarmDB;
    PRINT 'Database PlotFarmDB created.';
END
ELSE
BEGIN
    PRINT 'Database PlotFarmDB already exists.';
END
