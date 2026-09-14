import { useState, useEffect } from 'react';
import { StatCard, Button, Spinner, Alert, Card, Badge } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminKPIData } from './admin.types';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'farms-plots' | 'contracts' | 'requests' | 'harvest' | 'users') => void;
}

export default function AdminDashboard({ onNavigateTab }: AdminDashboardProps) {
  const [kpi, setKpi] = useState<AdminKPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadKPI() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.fetchKPI();
      setKpi(data);
    } catch (err: any) {
      console.error('Failed to load Admin KPI:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể tải số liệu KPI hệ thống');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadKPI();
  }, []);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Spinner size="lg" className="text-indigo-600" />
        <p className="text-sm text-gray-500 font-medium">Đang tải chỉ số phân tích KPI máy chủ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pt-6">
        <Alert variant="error" title="Lỗi tải KPI hệ thống">
          {error}
        </Alert>

        <div className="text-center">
          <Button variant="secondary" size="sm" onClick={loadKPI}>
            Thử lại kết nối
          </Button>
        </div>
      </div>
    );
  }

  const revenue = kpi?.totalRevenue ?? kpi?.tongDoanhThu ?? 0;
  const totalPlots = kpi?.totalPlots ?? kpi?.tongSoPlot ?? 0;
  const availablePlots = kpi?.availablePlots ?? kpi?.plotTrong ?? 0;
  const rentedPlots = kpi?.rentedPlots ?? kpi?.plotDangThue ?? 0;
  const occupancyRate = kpi?.occupancyRate ?? kpi?.tyLeLapDay ?? 0;
  const pendingRequests = kpi?.pendingCareRequests ?? kpi?.careRequestPending ?? 0;
  const totalFarms = kpi?.totalFarms ?? kpi?.tongSoFarm ?? 0;
  const expiringContracts = kpi?.expiringContractsCount ?? kpi?.contractSapHetHan ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
              Live KPI Center — REST API /api/v1/admin/kpi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            Trung Tâm Điều Hành Toàn Hệ Thống PlotFarm
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-0.5">
            Dữ liệu tổng hợp thời gian thực từ cơ sở dữ liệu MSSQL
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-300/40 text-white hover:bg-white/10"
            onClick={loadKPI}
          >
            🔄 Cập nhật số liệu
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid — 6 Required Metrics from Task 18 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Revenue */}
        <StatCard
          title="Doanh thu hợp đồng"
          value={formatCurrency(revenue)}
          subtext="Tổng từ HĐ Active & Completed"
          subtextClassName="text-indigo-600"
          icon="💰"
          iconBgColor="bg-indigo-100 text-indigo-700"
          valueClassName="text-xl sm:text-2xl text-indigo-950 font-bold"
        />

        {/* 2. Total Plots */}
        <StatCard
          title="Tổng thửa đất"
          value={`${totalPlots} Thửa`}
          subtext={`${totalFarms} nông trại đăng ký`}
          subtextClassName="text-blue-600"
          icon="🗺️"
          iconBgColor="bg-blue-100 text-blue-700"
        />

        {/* 3. Available Plots */}
        <StatCard
          title="Thửa đất trống"
          value={`${availablePlots} Thửa`}
          subtext="Sẵn sàng cho khách thuê"
          subtextClassName="text-emerald-600"
          icon="🌱"
          iconBgColor="bg-emerald-100 text-emerald-700"
        />

        {/* 4. Rented Plots */}
        <StatCard
          title="Thửa đang thuê"
          value={`${rentedPlots} Thửa`}
          subtext="Đang được nông dân canh tác"
          subtextClassName="text-amber-600"
          icon="🚜"
          iconBgColor="bg-amber-100 text-amber-700"
        />

        {/* 5. Occupancy Rate */}
        <StatCard
          title="Tỷ lệ lấp đầy"
          value={`${occupancyRate}%`}
          subtext={`${rentedPlots}/${totalPlots} thửa có hợp đồng`}
          subtextClassName="text-teal-600"
          icon="📈"
          iconBgColor="bg-teal-100 text-teal-700"
        />

        {/* 6. Pending Requests */}
        <StatCard
          title="Yêu cầu chờ duyệt"
          value={`${pendingRequests} Đơn`}
          subtext={pendingRequests > 0 ? "Cần phân bổ xử lý ngay" : "Hệ thống thông thoáng"}
          subtextClassName={pendingRequests > 0 ? "text-rose-600 font-bold" : "text-gray-500"}
          icon="⚠️"
          iconBgColor={pendingRequests > 0 ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-700"}
          valueClassName={pendingRequests > 0 ? "text-rose-700 font-extrabold" : "text-gray-900 font-bold"}
        />
      </div>

      {/* Progress & Quick Modules Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Rate Visual Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Hiệu suất khai thác ô đất
              </h3>
              <Badge variant={occupancyRate >= 70 ? 'success' : 'warning'} size="sm">
                {occupancyRate >= 70 ? 'Tối ưu' : 'Tiềm năng'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tỷ lệ chiếm dụng đất canh tác trên toàn bộ các nông trại
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-900">Đã cho thuê: {occupancyRate}%</span>
                <span className="text-gray-500">Còn trống: {(100 - occupancyRate).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full transition-all duration-700 rounded-l-full"
                  style={{ width: `${occupancyRate}%` }}
                />
                <div
                  className="bg-emerald-400 h-full transition-all duration-700 rounded-r-full"
                  style={{ width: `${100 - occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-gray-500 block">Hợp đồng sắp hết hạn:</span>
                <span className="text-sm font-bold text-amber-600">{expiringContracts} hợp đồng (30 ngày)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-gray-500 block">Nông trại hoạt động:</span>
                <span className="text-sm font-bold text-indigo-700">{totalFarms} cơ sở</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => onNavigateTab('farms-plots')}
            >
              Xem chi tiết bản đồ ô đất →
            </Button>
          </div>
        </Card>

        {/* Quick Management Shortcuts Card */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Lối tắt quản trị nhanh các phân hệ
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Truy cập trực tiếp vào các mô-đun quản lý chuyên sâu
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            <div
              onClick={() => onNavigateTab('farms-plots')}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition bg-white flex items-start gap-3 group"
            >
              <span className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                🏡
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">
                  Nông trại & Ô đất
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thêm sửa xóa ô đất, cập nhật giá thuê, cảm biến IoT & camera URL.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('contracts')}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition bg-white flex items-start gap-3 group"
            >
              <span className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                📜
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">
                  Hợp đồng thuê đất
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Giám sát tiền cọc, chuyển trạng thái ACTIVE, COMPLETED, CANCELLED.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('requests')}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition bg-white flex items-start gap-3 group"
            >
              <span className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                💬
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">
                    Yêu cầu chăm sóc
                  </h4>
                  {pendingRequests > 0 && (
                    <Badge variant="danger" size="sm">
                      {pendingRequests} chờ
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi phân công nông dân, ghi chú phản hồi và ảnh kết quả.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('harvest')}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition bg-white flex items-start gap-3 group"
            >
              <span className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                🌾
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">
                  Thu hoạch & Giao hàng
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lên lịch thu hoạch, cập nhật đóng gói, vận chuyển và mã vận đơn.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('users')}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition bg-white flex items-start gap-3 group sm:col-span-2"
            >
              <span className="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                👥
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">
                  Quản lý người dùng & Khách hàng
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Danh sách tài khoản Customer, Farmer, Admin. Xem lịch sử thuê đất và kích hoạt / khóa tài khoản.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
