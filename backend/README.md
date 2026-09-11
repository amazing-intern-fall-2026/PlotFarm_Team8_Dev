# PlotFarm Backend Service

Backend API cho nền tảng quản lý và thuê nông trại trực tuyến **PlotFarm**, xây dựng bằng Node.js, Express.js và Microsoft SQL Server.

---

## 1. Công Nghệ Sử Dụng

* **Runtime**: [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản `>= 20.x` hoặc `24.x`).
* **Framework**: [Express.js](https://expressjs.com/) (`v4.21.x`) với ES Modules (`"type": "module"`).
* **Cơ sở dữ liệu**: [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) kết nối qua driver [`mssql`](https://www.npmjs.com/package/mssql) (`v12.x`).
* **Bảo mật & Mã hóa**:
  * [`bcryptjs`](https://www.npmjs.com/package/bcryptjs): Băm mật khẩu một chiều với salt rounds.
  * [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken): Cấp phát và xác thực JSON Web Token (JWT).
  * [`helmet`](https://www.npmjs.com/package/helmet): Bảo vệ HTTP response headers.
  * [`cors`](https://www.npmjs.com/package/cors): Kiểm soát truy cập chéo nguồn từ Frontend.
* **Validation**: [`express-validator`](https://express-validator.github.io/) kiểm tra dữ liệu đầu vào.
* **Kiểm thử tự động**: [`jest`](https://jestjs.io/), [`supertest`](https://www.npmjs.com/package/supertest), [`cross-env`](https://www.npmjs.com/package/cross-env).

---

## 2. Yêu Cầu Cài Đặt

* **Node.js**: Phiên bản `>= 18.x` (Đã kiểm nghiệm tốt nhất trên Node.js v24.x).
* **npm**: Phiên bản `>= 9.x` hoặc `11.x`.
* **Database**: Microsoft SQL Server 2017 / 2019 / 2022 (Express, Developer hoặc Standard Edition).

---

## 3. Cấu Trúc Thư Mục Backend

```
backend/
├── database/                   # Quản lý schema và scripts cơ sở dữ liệu
│   ├── README.md               # Tài liệu chi tiết về database và hướng dẫn setup
│   └── scripts/                # Các script SQL (Tạo DB, Tạo bảng, Index, Seed)
├── src/
│   ├── config/                 # Cấu hình môi trường và Database Connection Pool
│   │   ├── config.js           # Quản lý và validate biến môi trường tập trung
│   │   └── database.js         # Singleton connection pool cho SQL Server
│   ├── controllers/            # Tầng Controller (Nhận HTTP request, trả JSON)
│   │   ├── authController.js   # Controller xác thực người dùng
│   │   ├── healthController.js # Controller kiểm tra sức khỏe hệ thống
│   │   ├── farmController.js   # Controller quản lý nông trại
│   │   └── contractController.js # Controller quản lý hợp đồng thuê
│   ├── middlewares/            # Middleware xử lý trung gian
│   │   ├── authenticate.js     # Xác thực JWT Access Token
│   │   ├── authorize.js        # Phân quyền vai trò người dùng (Role-based access)
│   │   ├── errorHandler.js     # Global error handler (Map lỗi SQL 2627/2601, 547)
│   │   └── notFound.js         # Xử lý route 404
│   ├── repositories/           # Tầng tương tác SQL thuần (Parameterized queries)
│   │   ├── authRepository.js   # Truy vấn Khách hàng, Nhân viên, Tài khoản
│   │   ├── farmRepository.js   # Truy vấn Nông trại
│   │   └── contractRepository.js # Truy vấn Ô đất, Cây trồng, Hợp đồng
│   ├── routes/                 # Định tuyến API
│   │   ├── authRoutes.js       # Tuyến đường Auth (/api/v1/auth)
│   │   ├── healthRoutes.js     # Tuyến đường Health (/api/v1/health)
│   │   ├── farmRoutes.js       # Tuyến đường Farm (/api/v1/farms)
│   │   └── contractRoutes.js   # Tuyến đường Contract (/api/v1/contracts)
│   ├── services/               # Tầng nghiệp vụ & Transaction
│   │   ├── authService.js      # Logic đăng ký, đăng nhập, JWT, bcrypt
│   │   ├── farmService.js      # Logic quản lý nông trại
│   │   └── contractService.js  # Logic kiểm tra trạng thái ô đất & tạo hợp đồng
│   ├── utils/                  # Tiện ích dùng chung
│   │   ├── AppError.js         # Custom operational error class
│   │   ├── idGenerator.js      # Hàm sinh mã tự tăng (UPDLOCK, HOLDLOCK)
│   │   ├── response.js         # Chuẩn hóa format JSON phản hồi
│   │   └── transactionHelper.js# Helper bọc logic trong Transaction an toàn
│   ├── validators/             # Bộ kiểm tra tính hợp lệ của dữ liệu
│   │   └── authValidator.js    # Schema validation cho Register, Login
│   ├── app.js                  # Khởi tạo ứng dụng Express và gắn middleware
│   └── server.js               # Điểm khởi động HTTP Server và graceful shutdown
├── tests/                      # Bộ kiểm thử tự động (Jest + Supertest)
│   ├── api.integration.test.js # Test tích hợp toàn diện HTTP API
│   ├── auth.test.js            # Test nghiệp vụ Auth, Validation, Duplicate
│   ├── errorHandler.test.js    # Test map mã lỗi SQL Server
│   ├── health.test.js          # Test API sức khỏe hệ thống
│   ├── middlewares.test.js     # Test authenticate & authorize
│   ├── repository.test.js      # Test tầng repository & tách Họ Tên
│   └── transaction.test.js     # Test Transaction commit & rollback
├── .env.example                # File mẫu các biến môi trường
├── package.json
└── README.md                   # Tài liệu hướng dẫn sử dụng Backend
```

---

## 4. Hướng Dẫn Cài Đặt & Cấu Hình

### Bước 1: Clone kho mã nguồn và cài đặt dependencies
```powershell
cd backend
npm install
```

### Bước 2: Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục `backend/` dựa trên file `.env.example`:
```powershell
Copy-Item .env.example .env
```

### Danh sách các biến môi trường:

| Biến Môi Trường | Ý Nghĩa | Giá Trị Mặc Định |
| :--- | :--- | :--- |
| `PORT` | Cổng dịch vụ Backend lắng nghe | `3000` |
| `NODE_ENV` | Môi trường chạy (`development`, `production`, `test`) | `development` |
| `CLIENT_URL` | URL của Frontend được phép kết nối (CORS) | `http://localhost:5173` |
| `DB_SERVER` | Địa chỉ máy chủ SQL Server | `localhost` |
| `DB_PORT` | Cổng kết nối SQL Server | `1433` |
| `DB_NAME` | Tên cơ sở dữ liệu | `PlotFarmDB` |
| `DB_USER` | Tên tài khoản SQL Server | `sa` |
| `DB_PASSWORD` | Mật khẩu SQL Server | *(Điền mật khẩu của bạn)* |
| `DB_ENCRYPT` | Bật/tắt mã hóa kết nối TLS/SSL | `false` |
| `DB_TRUST_SERVER_CERTIFICATE`| Bỏ qua xác thực chứng chỉ SSL tự ký trên máy local | `true` |
| `JWT_SECRET` | Khóa bí mật dùng để ký và giải mã JWT token | *(Chuỗi bí mật ngẫu nhiên)* |
| `JWT_EXPIRES_IN` | Thời hạn hiệu lực của Access Token | `1d` |
| `BCRYPT_SALT_ROUNDS` | Số vòng salt dùng khi băm mật khẩu bằng bcrypt | `10` |

### Bước 3: Khởi tạo và Seed Database
Xem hướng dẫn chi tiết tại [backend/database/README.md](file:///c:/Plotfram/PlotFarm_Team8_Dev/backend/database/README.md) để khởi tạo đầy đủ 8 bảng và nạp dữ liệu danh mục vai trò (`dbo.VAITRO`).

---

## 5. Lệnh Thực Thi (Scripts)

* **Chạy môi trường phát triển (Development với Nodemon tự reload):**
  ```powershell
  npm run dev
  ```
* **Chạy môi trường sản xuất (Production):**
  ```powershell
  npm start
  ```
* **Chạy toàn bộ bộ kiểm thử tự động (Unit & Integration Tests):**
  ```powershell
  npm test
  ```

---

## 6. Tài Liệu API Xác Thực (Authentication API Documentation)

* **Base URL**: `http://localhost:3000/api/v1`
* **Cách gửi JWT Token**: Đối với các endpoint yêu cầu đăng nhập, đính kèm token trong Header:
  ```http
  Authorization: Bearer <accessToken>
  ```

---

### 1. Health Check
* **Endpoint**: `GET /api/v1/health`
* **Yêu cầu JWT**: Không (Public)
* **Role**: Mọi người dùng
* **Mô tả**: Kiểm tra trạng thái hoạt động của Backend server và kết nối Database SQL Server.
* **Curl mẫu**:
  ```bash
  curl -X GET http://localhost:3000/api/v1/health
  ```
* **Response Thành công (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "OK",
    "data": {
      "uptime": 12.345,
      "database": "connected"
    },
    "meta": null
  }
  ```
* **Mã lỗi thường gặp**: `500 Internal Server Error` (khi database bị ngắt kết nối).

---

### 2. Đăng Ký Tài Khoản Khách Hàng (Register User)
* **Endpoint**: `POST /api/v1/auth/register`
* **Yêu cầu JWT**: Không (Public)
* **Role**: Mọi khách hàng mới
* **Request Body**:
  ```json
  {
    "fullName": "Nguyễn Văn Khách",
    "email": "khachhang@gmail.com",
    "phone": "0912345678",
    "shippingAddress": "123 Đường Nông Nghiệp, Quận 1, TP.HCM",
    "username": "khachhang01",
    "password": "Password123"
  }
  ```
* **Quy tắc Validation**:
  * `fullName`: Chuỗi không rỗng, tối đa 255 ký tự.
  * `email`: Đúng định dạng email hợp lệ, tối đa 254 ký tự.
  * `phone`: Đúng định dạng số điện thoại từ 9 đến 11 chữ số (`/^\d{9,11}$/`).
  * `shippingAddress`: Chuỗi không rỗng, tối đa 500 ký tự.
  * `username`: Từ 3 đến 30 ký tự, không chứa khoảng trắng.
  * `password`: Tối thiểu 8 ký tự.
* **Curl mẫu**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Nguyễn Văn Khách\",\"email\":\"khachhang@gmail.com\",\"phone\":\"0912345678\",\"shippingAddress\":\"123 Đường Nông Nghiệp, TP.HCM\",\"username\":\"khachhang01\",\"password\":\"Password123\"}"
  ```
* **Response Thành công (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "account": {
        "username": "khachhang01"
      },
      "customer": {
        "id": "KH001",
        "fullName": "Nguyễn Văn Khách",
        "email": "khachhang@gmail.com"
      }
    },
    "meta": null
  }
  ```
* **Mã lỗi thường gặp**:
  * `400 Bad Request`: Dữ liệu không hợp lệ (ví dụ mật khẩu ngắn hơn 8 ký tự, số điện thoại sai định dạng).
  * `409 Conflict`: Tên tài khoản, email hoặc số điện thoại đã tồn tại.

---

### 3. Đăng Ký Tài Khoản Nhân Viên / Nông Dân (Register Employee)
* **Endpoint**: `POST /api/v1/auth/register-employee`
* **Yêu cầu JWT**: **Có**
* **Role cho phép**: **`ADMIN`** (Bảo vệ bởi `authenticate` và `authorize('ADMIN')`)
* **Request Body**:
  ```json
  {
    "fullName": "Lê Văn Nông Dân",
    "email": "nongdan@plotfarm.com",
    "phone": "0987654321",
    "username": "farmer01",
    "password": "FarmerPassword123",
    "role": "FARMER"
  }
  ```
* **Quy tắc Validation**:
  * `fullName`: Tối đa 200 ký tự.
  * `role`: Bắt buộc là `FARMER` hoặc `ADMIN`.
* **Curl mẫu**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/register-employee \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
    -d "{\"fullName\":\"Lê Văn Nông Dân\",\"email\":\"nongdan@plotfarm.com\",\"phone\":\"0987654321\",\"username\":\"farmer01\",\"password\":\"FarmerPassword123\",\"role\":\"FARMER\"}"
  ```
* **Response Thành công (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Đăng ký nhân viên thành công",
    "data": {
      "account": {
        "username": "farmer01",
        "role": "FARMER"
      },
      "employee": {
        "id": "NV001",
        "fullName": "Lê Văn Nông Dân",
        "email": "nongdan@plotfarm.com"
      }
    },
    "meta": null
  }
  ```
* **Mã lỗi thường gặp**:
  * `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ.
  * `403 Forbidden`: Người dùng không có vai trò `ADMIN`.
  * `409 Conflict`: Username, email hoặc số điện thoại bị trùng.

---

### 4. Đăng Nhập (Login)
* **Endpoint**: `POST /api/v1/auth/login`
* **Yêu cầu JWT**: Không (Public)
* **Role**: Mọi người dùng đã có tài khoản
* **Request Body**:
  ```json
  {
    "username": "khachhang01",
    "password": "Password123"
  }
  ```
* **Curl mẫu**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"khachhang01\",\"password\":\"Password123\"}"
  ```
* **Response Thành công (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "KH001",
        "accountId": "khachhang01",
        "fullName": "Nguyễn Văn Khách",
        "email": "khachhang@gmail.com",
        "userType": "CUSTOMER",
        "role": "CUSTOMER"
      }
    },
    "meta": null
  }
  ```
* **Mã lỗi thường gặp**:
  * `400 Bad Request`: Thiếu username hoặc password.
  * `401 Unauthorized`: Sai tên đăng nhập hoặc sai mật khẩu.

---

### 5. Lấy Thông Tin Người Dùng Hiện Tại (Get Current User Profile)
* **Endpoint**: `GET /api/v1/auth/me`
* **Yêu cầu JWT**: **Có**
* **Role cho phép**: Mọi vai trò đã đăng nhập (`CUSTOMER`, `FARMER`, `ADMIN`)
* **Headers**: `Authorization: Bearer <token>`
* **Curl mẫu**:
  ```bash
  curl -X GET http://localhost:3000/api/v1/auth/me \
    -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
  ```
* **Response Thành công (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin thành công",
    "data": {
      "user": {
        "id": "KH001",
        "fullName": "Nguyễn Văn Khách",
        "email": "khachhang@gmail.com",
        "userType": "CUSTOMER",
        "role": "CUSTOMER"
      }
    },
    "meta": null
  }
  ```
* **Mã lỗi thường gặp**:
  * `401 Unauthorized`: Token không tồn tại, hết hạn hoặc không hợp lệ.
  * `404 Not Found`: Không tìm thấy hồ sơ người dùng trong CSDL.

---

## 7. Xử Lý Các Lỗi Thường Gặp (Troubleshooting)

| Tình Huống Lỗi | Nguyên Nhân | Cách Khắc Phục |
| :--- | :--- | :--- |
| `Authorization token missing or malformed` (401) | Header Authorization bị thiếu hoặc không đúng tiền tố `Bearer ` | Gửi đúng format: `Authorization: Bearer <token>`. |
| `Token đã hết hạn` (401) | Access Token đã quá thời hạn hiệu lực (`JWT_EXPIRES_IN`) | Gọi lại API Login để lấy Access Token mới. |
| `Forbidden: insufficient role` (403) | Người dùng không đủ quyền thực hiện hành động | Kiểm tra lại vai trò của user (ví dụ chỉ Admin mới gọi được `/register-employee`). |
| `Dữ liệu đã tồn tại trong hệ thống (Duplicate Key)` (409) | Trùng lặp username, email hoặc phone | Nhập thông tin tài khoản, email hoặc số điện thoại khác. |
| `Cannot find module` hoặc lỗi import | Chưa chạy `npm install` hoặc thiếu file `.env` | Chạy `npm install` và đảm bảo file `.env` đã được cấu hình. |
| Lỗi kết nối SQL Server | SQL Server chưa start hoặc sai password trong `.env` | Kiểm tra trạng thái dịch vụ SQL Server và biến `DB_*` trong `.env`. |
