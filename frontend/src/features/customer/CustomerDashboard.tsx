import { useState, useEffect } from "react";
import { customerService } from "./customer.service";
import type {
  CustomerKPISummary,
  CustomerTab,
  SharedCareRequestItem,
  SharedFarmingLogItem,
  SharedPlotItem,
} from "./customer.types";
import { Badge, Button, Card, StatCard } from "../../components/ui";

interface CustomerDashboardProps {
  onNavigateTab: (tab: CustomerTab) => void;
  onOpenCreateRequest: (plotCode?: string) => void;
}

export default function CustomerDashboard({
  onNavigateTab,
  onOpenCreateRequest,
}: CustomerDashboardProps) {
  const [kpi, setKpi] = useState<CustomerKPISummary>(() =>
    customerService.getKPISummary(),
  );
  const [plots, setPlots] = useState<SharedPlotItem[]>(() =>
    customerService.getMyPlots(),
  );
  const [logs, setLogs] = useState<SharedFarmingLogItem[]>(() =>
    customerService.getMyFarmingLogs(),
  );
  const [requests, setRequests] = useState<SharedCareRequestItem[]>(() =>
    customerService.getMyCareRequests(),
  );

  useEffect(() => {
    function handleDataSync() {
      setKpi(customerService.getKPISummary());
      setPlots(customerService.getMyPlots());
      setLogs(customerService.getMyFarmingLogs());
      setRequests(customerService.getMyCareRequests());
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, []);

  const activeCustomer = customerService.getActiveCustomerProfile();

  function getPlantStatusBadge(status: string) {
    switch (status) {
      case "Đang ra hoa":
        return <Badge variant="info">🌸 Đang ra hoa</Badge>;
      case "Phát triển tốt":
        return <Badge variant="success">🌿 Phát triển tốt</Badge>;
      case "Chuẩn bị thu hoạch":
        return <Badge variant="warning">🌾 Chuẩn bị thu hoạch</Badge>;
      case "Cần chú ý chăm sóc":
        return <Badge variant="danger">⚠️ Cần chú ý</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  function getRequestStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Chờ xử lý</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="info">Đang thực hiện</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Đã hoàn thành</Badge>;
      case "CANNOT_RESOLVE":
        return <Badge variant="danger">Không thể xử lý</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30 mb-3">
            <span>🌱</span> Cổng Giám Sát Nông Trại Trực Tuyến
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl tracking-tight">
            Xin chào, {activeCustomer.name}!
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Hệ thống đang đồng bộ dữ liệu thời gian thực với Nông dân phụ trách tại các trang trại. Bạn có thể theo dõi cảm biến IoT đất, xem hình ảnh nhật ký thực địa và gửi yêu cầu chăm sóc trực tiếp đến nông dân.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="bg-white text-emerald-900 font-semibold hover:bg-emerald-50 border-0 shadow-sm"
              onClick={() => onOpenCreateRequest()}
            >
              + Tạo Yêu Cầu Chăm Sóc
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="bg-emerald-700/60 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-700"
              onClick={() => onNavigateTab("plots")}
            >
              Xem Thửa Đất Của Tôi
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="bg-emerald-700/60 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-700"
              onClick={() => onNavigateTab("farms")}
            >
              Khám Phá & Thuê Thửa Mới
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Thửa đất đang thuê"
          value={`${kpi.totalOwnedPlots} Thửa`}
          subtext={`Tổng diện tích: ${kpi.totalAreaSquareMeter.toLocaleString()} m²`}
          subtextClassName="text-emerald-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          iconBgColor="bg-emerald-100 text-emerald-700"
        />

        <StatCard
          title="Tiến độ vụ mùa TB"
          value={`${kpi.averageCropProgress}%`}
          subtext="Giai đoạn phát triển ổn định"
          subtextClassName="text-teal-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBgColor="bg-teal-100 text-teal-700"
        />

        <StatCard
          title="Yêu cầu chăm sóc"
          value={`${kpi.pendingCareRequests} Đang xử lý`}
          subtext={`Đã hoàn tất: ${kpi.completedCareRequests} yêu cầu`}
          subtextClassName="text-amber-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          iconBgColor="bg-amber-100 text-amber-700"
        />

        <StatCard
          title="Vụ mùa thu hoạch"
          value={`${kpi.upcomingHarvests} Vụ dự kiến`}
          subtext="Đồng bộ kế hoạch cùng nông dân"
          subtextClassName="text-blue-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          iconBgColor="bg-blue-100 text-blue-700"
        />
      </div>

      {/* Active Plots Cards with Live Sensors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Thửa Đất Canh Tác Của Bạn ({plots.length})
            </h2>
            <p className="text-xs text-gray-500">
              Dữ liệu cảm biến IoT và hình ảnh thực địa do Nông dân trực tiếp giám sát.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => onNavigateTab("plots")}
          >
            Quản lý chi tiết →
          </Button>
        </div>

        {plots.length === 0 ? (
          <Card>
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-gray-500">
                Bạn chưa sở hữu hoặc thuê thửa đất nào.
              </p>
              <Button
                variant="primary"
                size="sm"
                fullWidth={false}
                onClick={() => onNavigateTab("farms")}
              >
                Khám phá nông trại & Thuê thửa đất ngay
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition space-y-4"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {plot.plotCode}
                      </span>
                      <span className="text-xs text-gray-500">
                        HĐ: {plot.contractId}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      {plot.plantCrop}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <span>📍</span> {plot.farmName}
                    </p>
                  </div>
                  {getPlantStatusBadge(plot.plantStatus)}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-600">Tiến độ sinh trưởng:</span>
                    <span className="text-emerald-700">{plot.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${plot.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-2xs text-gray-400 mt-1">
                    <span>Gieo: {plot.startDate}</span>
                    <span>Cập nhật: {plot.lastUpdate}</span>
                    <span>Thu hoạch dự kiến: {plot.endDate}</span>
                  </div>
                </div>

                {/* Sensor Quick Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-gray-100 text-center">
                  <div className="space-y-0.5">
                    <span className="text-2xs text-gray-500 block">Độ ẩm đất</span>
                    <span className="text-sm font-bold text-blue-700">
                      💧 {plot.sensorData?.moisture || 70}%
                    </span>
                  </div>
                  <div className="space-y-0.5 border-x border-gray-200">
                    <span className="text-2xs text-gray-500 block">Nhiệt độ</span>
                    <span className="text-sm font-bold text-amber-700">
                      🌡️ {plot.sensorData?.temperature || 28}°C
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-2xs text-gray-500 block">pH đất</span>
                    <span className="text-sm font-bold text-emerald-700">
                      🧪 {plot.sensorData?.soilPh || 6.5}
                    </span>
                  </div>
                </div>

                {/* Footer Farmer & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span>👨‍🌾</span>
                    <span>Nông dân: <strong>{plot.farmerName || "Lê Văn Canh Tác"}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCreateRequest(plot.plotCode)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      + Gửi yêu cầu
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("plots")}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                    >
                      Xem camera
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column Section: Latest Farming Logs & Care Requests Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Latest Farming Logs from Farmer */}
        <Card>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <h3 className="text-sm font-bold text-gray-900">
                Nhật Ký Canh Tác Mới Nhất
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("logs")}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Xem tất cả ({logs.length}) →
            </button>
          </div>

          <div className="p-4 divide-y divide-gray-100">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Chưa có nhật ký canh tác nào cho thửa đất của bạn.
              </p>
            ) : (
              logs.slice(0, 3).map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800">
                      {log.plot} • {log.activity}
                    </span>
                    <span className="text-gray-400 text-2xs">{log.date}</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                    {log.description}
                  </p>
                  <div className="flex items-center justify-between text-2xs text-gray-500 pt-1">
                    <span>Ghi nhận bởi: {log.createdBy}</span>
                    {log.imageEvidence && (
                      <span className="text-emerald-700 font-medium">
                        📷 Có ảnh thực địa
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: Care Requests Status */}
        <Card>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <h3 className="text-sm font-bold text-gray-900">
                Yêu Cầu Chăm Sóc Gần Đây
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("requests")}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Xem tất cả ({requests.length}) →
            </button>
          </div>

          <div className="p-4 divide-y divide-gray-100">
            {requests.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-gray-400">
                  Bạn chưa gửi yêu cầu chăm sóc nào.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={() => onOpenCreateRequest()}
                >
                  + Gửi yêu cầu chăm sóc đầu tiên
                </Button>
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <div key={req.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">#{req.id}</span>
                      <span className="text-gray-500 font-mono">({req.plot})</span>
                      <span className="text-purple-800 font-medium">
                        {req.requestType}
                      </span>
                    </div>
                    {getRequestStatusBadge(req.status)}
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-1 italic">
                    "{req.description}"
                  </p>
                  {req.farmerNote && (
                    <div className="rounded-lg bg-emerald-50/70 p-2 text-2xs text-emerald-900 border border-emerald-100">
                      <strong>Nông dân phản hồi:</strong> {req.farmerNote}
                    </div>
                  )}
                  <div className="text-2xs text-gray-400 flex justify-between">
                    <span>Gửi: {req.createdDate}</span>
                    {req.processedDate && <span>Xong: {req.processedDate}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
