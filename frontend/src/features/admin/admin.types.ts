export interface AdminKPIData {
  tongDoanhThu: number;
  totalRevenue: number;
  tongSoPlot: number;
  totalPlots: number;
  plotTrong: number;
  availablePlots: number;
  plotDangThue: number;
  rentedPlots: number;
  tyLeLapDay: number;
  occupancyRate: number;
  careRequestPending: number;
  pendingCareRequests: number;
  tongSoFarm?: number;
  totalFarms?: number;
  contractSapHetHan?: number;
  expiringContractsCount?: number;
}

export interface AdminFarm {
  MaNongTrai: string;
  TenNongTrai: string;
  DiaChi: string;
  TrangThai: 'PENDING' | 'APPROVED' | 'INACTIVE';
  CreatedAt?: string;
  UpdatedAt?: string;
  MaChuNongTrai?: string;
  TenChuNongTrai?: string;
  EmailChuNongTrai?: string;
  DienThoaiChuNongTrai?: string;
  SoLuongPlot?: number;
  TongDienTich?: number;
}

export interface AdminPlot {
  MaODat: string;
  MaNongTrai: string;
  TenODat: string;
  DienTich: number;
  TrangThai: 'TRONG' | 'DANG_THUE' | 'BAO_TRI';
  GiaThue: number;
  CameraUrl?: string | null;
  HinhAnhThumbnail?: string | null;
  TenNongTrai?: string;
  MaChuNongTrai?: string;
  DoAmDat?: number | null;
  NhietDo?: number | null;
  DoPH?: number | null;
  AnhSangLux?: number | null;
  UpdatedAt?: string;
}

export interface AdminContract {
  MaHopDong: string;
  MaKH: string;
  TenKH?: string;
  Email?: string;
  DienThoai?: string;
  MaODat: string;
  TenODat?: string;
  DienTich?: number;
  TenNongTrai?: string;
  MaCayTrong: string;
  TenCayTrong?: string;
  LoaiCay?: string;
  ThoiGianThuHoach?: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  TongTien: number;
  depositAmount: number;
  TrangThai: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  CreatedAt?: string;
}

export interface AdminCareRequest {
  MaYeuCau: string;
  MaHopDong: string;
  MaKH: string;
  TenKH?: string;
  EmailKhachHang?: string;
  DienThoaiKhachHang?: string;
  MaODat?: string;
  TenODat?: string;
  MaNongTrai?: string;
  TenNongTrai?: string;
  MaChuNongTrai?: string;
  TenNongDanPhuTrach?: string;
  LoaiYeuCau: string;
  MoTa: string;
  TrangThai: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  GhiChuPhanHoi?: string;
  HinhAnhKetQua?: string;
  TenNguoiXuLy?: string;
  CreatedAt: string;
  UpdatedAt?: string;
  CompletedAt?: string;
}

export interface AdminHarvest {
  MaThuHoach: string;
  MaHopDong: string;
  TenKH?: string;
  DienThoaiKhachHang?: string;
  TenODat?: string;
  TenNongTrai?: string;
  TenCayTrong?: string;
  NgayThuHoachDuKien: string;
  NgayThuHoachThucTe?: string | null;
  SanLuongDuKien: number;
  SanLuongThucTe?: number | null;
  TrangThaiThuHoach: 'SCHEDULED' | 'IN_PROGRESS' | 'HARVESTED' | 'CANCELLED';
  TrangThaiDongGoi: 'NOT_PACKED' | 'PACKED' | 'STORAGE_COOL';
  TrangThaiGiaoHang: 'WAITING_PICKUP' | 'DELIVERING' | 'DELIVERED';
  MaVanDon?: string | null;
  DiaChiGiaoHang: string;
  GhiChu?: string | null;
  CreatedAt?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'FARMER' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

// Payloads
export interface CreateFarmPayload {
  TenNongTrai: string;
  DiaChi: string;
  MaChuNongTrai?: string;
  TrangThai?: 'PENDING' | 'APPROVED' | 'INACTIVE';
}

export interface UpdateFarmPayload {
  TenNongTrai?: string;
  DiaChi?: string;
  MaChuNongTrai?: string;
  TrangThai?: 'PENDING' | 'APPROVED' | 'INACTIVE';
}

export interface CreatePlotPayload {
  MaNongTrai: string;
  TenODat: string;
  DienTich: number;
  GiaThue: number;
  TrangThai?: 'TRONG' | 'DANG_THUE' | 'BAO_TRI';
  CameraUrl?: string | null;
  HinhAnhThumbnail?: string | null;
}

export interface UpdatePlotPayload {
  TenODat?: string;
  DienTich?: number;
  GiaThue?: number;
  TrangThai?: 'TRONG' | 'DANG_THUE' | 'BAO_TRI';
  CameraUrl?: string | null;
  HinhAnhThumbnail?: string | null;
}

export interface UpdatePlotSensorPayload {
  DoAmDat?: number;
  NhietDo?: number;
  DoPH?: number;
  AnhSangLux?: number;
}

export interface UpdateCareRequestPayload {
  trangThai: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  ghiChuPhanHoi?: string;
  hinhAnhKetQua?: string;
}

export interface CreateHarvestPayload {
  maHopDong: string;
  ngayThuHoachDuKien: string;
  sanLuongDuKien: number;
  diaChiGiaoHang?: string;
  ghiChu?: string;
}

export interface UpdateHarvestStatusPayload {
  status?: string;
  trangThaiThuHoach?: 'SCHEDULED' | 'IN_PROGRESS' | 'HARVESTED' | 'CANCELLED';
  trangThaiDongGoi?: 'NOT_PACKED' | 'PACKED' | 'STORAGE_COOL';
  trangThaiGiaoHang?: 'WAITING_PICKUP' | 'DELIVERING' | 'DELIVERED';
  sanLuongThucTe?: number;
  ngayThuHoachThucTe?: string;
  ghiChu?: string;
}

export interface UpdateHarvestDeliveryPayload {
  diaChiGiaoHang?: string;
  maVanDon?: string;
  trangThaiGiaoHang?: 'WAITING_PICKUP' | 'DELIVERING' | 'DELIVERED';
  trangThaiDongGoi?: 'NOT_PACKED' | 'PACKED' | 'STORAGE_COOL';
  ghiChu?: string;
}
