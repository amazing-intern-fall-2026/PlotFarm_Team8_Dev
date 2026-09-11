# Tài Liệu Hướng Dẫn Cơ Sở Dữ Liệu PlotFarm (SQL Server)

Tài liệu này cung cấp hướng dẫn chi tiết về cấu trúc, quy trình khởi tạo, bảo trì và xử lý sự cố cho cơ sở dữ liệu `PlotFarmDB`.

---

## 1. Tổng Quan Cơ Sở Dữ Liệu

* **Hệ quản trị CSDL**: Microsoft SQL Server (Hỗ trợ phiên bản 2017, 2019, 2022 hoặc Azure SQL).
* **Tên CSDL mặc định**: `PlotFarmDB`.
* **Bộ ký tự (Collation)**: `SQL_Latin1_General_CP1_CI_AS` (hoặc collation mặc định hỗ trợ Unicode qua `NVARCHAR`).
* **Công cụ khuyên dùng**:
  * [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
  * [Azure Data Studio](https://learn.microsoft.com/en-us/azure-data-studio/download-azure-data-studio)
  * `sqlcmd` (Công cụ dòng lệnh cho Windows / Linux)

---

## 2. Danh Sách & Mục Đích Các File SQL Scripts

Thư mục `backend/database/scripts/` bao gồm 4 script được thiết kế theo dạng **idempotent** (có thể chạy lại nhiều lần an toàn):

| Tên File | Mục Đích |
| :--- | :--- |
| `001_create_database.sql` | Kiểm tra và khởi tạo CSDL `PlotFarmDB` nếu chưa tồn tại. |
| `002_create_tables.sql` | Tạo 8 bảng cốt lõi với khóa chính, khóa ngoại, ràng buộc `CHECK`, `UNIQUE` và quy định `NOT NULL`. |
| `003_create_indexes.sql` | Tạo các Index tối ưu hóa truy vấn trên các cột khóa ngoại (`MaVaiTro`, `MaKH`, `MaNV`, `MaChuNongTrai`,...). |
| `004_seed_reference_data.sql` | Nạp dữ liệu mẫu ban đầu cho bảng danh mục vai trò (`dbo.VAITRO`), bọc trong transaction an toàn. |

---

## 3. Thứ Tự Thực Thi Khởi Tạo Database

Khi thiết lập môi trường mới, **bắt buộc** thực thi các script theo đúng thứ tự tuần tự sau:

### Bước 1: Tạo Database
Chạy script `001_create_database.sql`:
```sql
-- Kết nối tới instance SQL Server (database master)
:r ./backend/database/scripts/001_create_database.sql
```

### Bước 2: Tạo các Bảng & Ràng buộc
Chuyển context sang database `PlotFarmDB` (`USE PlotFarmDB;`), sau đó chạy `002_create_tables.sql`:
```sql
USE PlotFarmDB;
GO
:r ./backend/database/scripts/002_create_tables.sql
```
*Script sẽ tạo lần lượt 8 bảng:*
1. `VAITRO`: Bảng vai trò hệ thống (`ADMIN`, `FARMER`, `CUSTOMER`).
2. `KHACHHANG`: Thông tin khách hàng (`MaKH`, `TenKH`, `Email`, `DienThoai`,...).
3. `NHANVIEN`: Thông tin nhân viên & nông dân (`MaNV`, `Ho`, `Ten`, `Email`, `ChucVu`,...).
4. `TAIKHOAN`: Tài khoản đăng nhập (`TenDangNhap`, `MatKhauHash`, liên kết `MaKH` hoặc `MaNV`).
5. `NONGTRAI`: Nông trại do nông dân quản lý.
6. `CAYTRONG`: Danh mục các loại cây trồng và thời gian sinh trưởng.
7. `ODAT`: Các ô đất canh tác thuộc nông trại kèm giá thuê.
8. `HOPDONGTHUE`: Hợp đồng thuê ô đất giữa khách hàng và nông trại.

### Bước 3: Tạo Index Tối Ưu
Chạy script `003_create_indexes.sql`:
```sql
USE PlotFarmDB;
GO
:r ./backend/database/scripts/003_create_indexes.sql
```

### Bước 4: Nạp Dữ Liệu Seed (Idempotent Seed)
Chạy script `004_seed_reference_data.sql`:
```sql
USE PlotFarmDB;
GO
:r ./backend/database/scripts/004_seed_reference_data.sql
```
*Script sử dụng `IF NOT EXISTS` và bọc trong `BEGIN TRANSACTION ... COMMIT ... CATCH ROLLBACK` nên có thể chạy lại bất kỳ lúc nào mà không gây trùng dữ liệu hay lỗi khóa chính.*

---

## 4. Cấu Hình Kết Nối Trong File `.env`

Tạo file `backend/.env` từ file mẫu `backend/.env.example` với các biến cấu hình sau:

```env
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=PlotFarmDB
DB_USER=sa
DB_PASSWORD=your_db_password_here
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Ý nghĩa các tham số:
* `DB_SERVER`: Địa chỉ host SQL Server (ví dụ `localhost`, `127.0.0.1`, hoặc tên named instance như `localhost\SQLEXPRESS`).
* `DB_PORT`: Cổng mạng (mặc định của SQL Server là `1433`). Nếu dùng named instance có dấu gạch chéo `\`, biến này sẽ tự động được bỏ qua theo logic trong `config.js`.
* `DB_NAME`: Tên database (`PlotFarmDB`).
* `DB_USER` / `DB_PASSWORD`: Tài khoản đăng nhập SQL Server (SQL Authentication).
* `DB_ENCRYPT`: Mã hóa kết nối SSL/TLS (`true` nếu dùng Azure SQL hoặc production; `false` cho local).
* `DB_TRUST_SERVER_CERTIFICATE`: `true` để bỏ qua kiểm tra chứng chỉ SSL tự ký trên máy local.

---

## 5. Hướng Dẫn Kiểm Tra Kết Nối & Kiểm Tra Đủ Bảng

### Kiểm tra kết nối từ Backend
Tại thư mục `backend/`, chạy lệnh Node.js sau để kiểm tra kết nối:
```powershell
node -e "import('./src/config/database.js').then(m => m.connectDatabase().then(() => { console.log('✅ Kết nối thành công!'); process.exit(0); }).catch(e => { console.error('❌ Lỗi kết nối:', e.message); process.exit(1); }))"
```

### Kiểm tra đủ 8/8 bảng trong database
Thực thi truy vấn sau trên SSMS hoặc qua node script:
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```
**Danh sách 8 bảng chuẩn bắt buộc phải có:**
1. `CAYTRONG`
2. `HOPDONGTHUE`
3. `KHACHHANG`
4. `NHANVIEN`
5. `NONGTRAI`
6. `ODAT`
7. `TAIKHOAN`
8. `VAITRO`

---

## 6. Quy Trình Reset Database (Dành Cho Môi Trường Phát Triển)

> [!CAUTION]
> Lệnh này sẽ xóa toàn bộ dữ liệu hiện có trong CSDL `PlotFarmDB`. **CHỈ SỬ DỤNG TRÊN MÔI TRƯỜNG LOCAL / DEVELOPMENT**.

Thực hiện trong SSMS hoặc sqlcmd kết nối tới database `master`:

```sql
USE master;
GO

-- 1. Đóng toàn bộ kết nối đang mở tới database
ALTER DATABASE PlotFarmDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- 2. Xóa database cũ
DROP DATABASE IF EXISTS PlotFarmDB;
GO

-- 3. Tạo lại database
CREATE DATABASE PlotFarmDB;
GO

-- 4. Chuyển context sang PlotFarmDB
USE PlotFarmDB;
GO

-- 5. Lần lượt chạy lại 002_create_tables.sql, 003_create_indexes.sql, 004_seed_reference_data.sql
```

---

## 7. Xử Lý Các Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi `Login failed for user 'sa'` (Mã lỗi 18456)
* **Nguyên nhân**: Sai mật khẩu, tài khoản `sa` bị vô hiệu hóa, hoặc SQL Server chưa bật chế độ *SQL Server and Windows Authentication mode*.
* **Cách khắc phục**:
  1. Mở SSMS, kết nối bằng Windows Authentication.
  2. Chuột phải vào Server -> Properties -> Security -> Chọn **SQL Server and Windows Authentication mode**.
  3. Vào Security -> Logins -> Chuột phải `sa` -> Properties: Đặt lại mật khẩu và chuyển Status sang **Grant/Enabled**.
  4. Khởi động lại dịch vụ SQL Server (Restart service).

### 2. Lỗi `Failed to connect to localhost:1433 - connect ECONNREFUSED`
* **Nguyên nhân**: Dịch vụ SQL Server chưa chạy hoặc giao thức TCP/IP bị tắt.
* **Cách khắc phục**:
  1. Mở **SQL Server Configuration Manager**.
  2. Kiểm tra dịch vụ **SQL Server (MSSQLSERVER)** hoặc **SQL Server (SQLEXPRESS)** đang ở trạng thái *Running*.
  3. Vào **SQL Server Network Configuration** -> **Protocols for MSSQLSERVER** -> Bật (**Enable**) giao thức **TCP/IP**.
  4. Chuột phải TCP/IP -> Properties -> tab *IP Addresses* -> Kéo xuống cuối mục *IPAll* -> Đặt **TCP Port** là `1433`.
  5. Restart dịch vụ SQL Server.

### 3. Lỗi `Self-signed certificate` hoặc `SSL Provider: The certificate chain was issued by an authority that is not trusted`
* **Cách khắc phục**: Trong file `.env`, đặt `DB_TRUST_SERVER_CERTIFICATE=true` và `DB_ENCRYPT=false`.

### 4. Lỗi `Violation of PRIMARY KEY / UNIQUE KEY constraint` (Mã lỗi 2627 / 2601)
* **Nguyên nhân**: Dữ liệu nạp bị trùng lặp khóa chính hoặc trường duy nhất (như `Email`).
* **Cách khắc phục**: Hệ thống đã map lỗi này về HTTP `409 Conflict`. Khi nạp seed bằng tay, luôn sử dụng mệnh đề `IF NOT EXISTS` như trong `004_seed_reference_data.sql`.

### 5. Lỗi `The INSERT statement conflicted with the FOREIGN KEY constraint` (Mã lỗi 547)
* **Nguyên nhân**: Bản ghi cha chưa tồn tại (ví dụ tạo tài khoản với `MaVaiTro` không có trong bảng `VAITRO`, hoặc tạo ô đất với `MaNongTrai` không tồn tại).
* **Cách khắc phục**: Luôn nạp bảng danh mục cha trước (`VAITRO`, `KHACHHANG`, `NHANVIEN`, `NONGTRAI`) trước khi insert vào bảng con (`TAIKHOAN`, `ODAT`, `HOPDONGTHUE`).
