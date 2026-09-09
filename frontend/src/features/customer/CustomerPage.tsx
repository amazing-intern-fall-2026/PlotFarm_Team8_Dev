import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import {
  StatCard,
  Badge,
  Alert,
  Modal,
  Button,
  Card,
  Input,
} from "../../components/ui";

interface CustomerPlot {
  id: string;
  code: string;
  areaName: string;
  cropType: string;
  size: string;
  status: "good" | "blooming" | "needs_water";
  statusText: string;
}

export default function CustomerPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [notification, setNotification] = useState<string | null>(
    "Đăng nhập thành công! Chào mừng bạn đến với Cổng thông tin Khách hàng PlotFarm.",
  );

  const [isRegisterPlotModalOpen, setIsRegisterPlotModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Registration modal form state
  const [newPlotName, setNewPlotName] = useState("");
  const [newPlotCrop, setNewPlotCrop] = useState("Lúa ST25");
  const [newPlotArea, setNewPlotArea] = useState("");

  const [plots, setPlots] = useState<CustomerPlot[]>([
    {
      id: "1",
      code: "#PL-0192",
      areaName: "Khu Đồng Xanh - Thửa A1",
      cropType: "Lúa ST25 Đặc sản",
      size: "5.000 m²",
      status: "good",
      statusText: "Phát triển tốt",
    },
    {
      id: "2",
      code: "#PL-0205",
      areaName: "Khu Thung Lũng - Thửa B4",
      cropType: "Cà phê Robusta",
      size: "4.500 m²",
      status: "blooming",
      statusText: "Đang ra hoa",
    },
    {
      id: "3",
      code: "#PL-0311",
      areaName: "Khu Vườn Ươm - Thửa C2",
      cropType: "Rau củ hữu cơ cao cấp",
      size: "3.000 m²",
      status: "needs_water",
      statusText: "Cần tưới nước",
    },
  ]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleAddPlot() {
    if (!newPlotName.trim() || !newPlotArea.trim()) {
      alert("Vui lòng điền đầy đủ tên khu vực và diện tích thửa đất!");
      return;
    }

    const randomId = Math.floor(Math.random() * 900) + 100;
    const newPlot: CustomerPlot = {
      id: String(Date.now()),
      code: `#PL-0${randomId}`,
      areaName: newPlotName,
      cropType: newPlotCrop,
      size: `${newPlotArea} m²`,
      status: "good",
      statusText: "Mới tạo",
    };

    setPlots((prev) => [newPlot, ...prev]);
    setNewPlotName("");
    setNewPlotArea("");
    setIsRegisterPlotModalOpen(false);
    setNotification(`Thửa đất ${newPlot.code} đã được thêm vào hệ thống giám sát!`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Standardized Reusable Navbar */}
      <Navbar
        brandTitle="Plot"
        brandHighlight="Farm"
        portalBadge="Customer Portal"
        user={{
          name: user?.fullName || user?.username || "Khách hàng",
          email: user?.email || "customer@plotfarm.com",
          avatarText: (user?.fullName || user?.username || "C").charAt(0),
        }}
        onLogout={handleLogout}
        logoutText="Đăng xuất"
      />

      {/* Main Container */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Welcome Alert */}
          {notification && (
            <Alert
              variant="success"
              title="Chào mừng bạn đã trở lại!"
              onClose={() => setNotification(null)}
            >
              {notification}
            </Alert>
          )}

          {/* Customer Overview Banner */}
          <div className="rounded-2xl bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 sm:p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-200 mb-2">
                Trang Tổng Quan Khách Hàng
              </span>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Xin chào, {user?.fullName || user?.username || "Khách hàng"}!
              </h1>
              <p className="mt-2 text-sm text-emerald-100">
                Theo dõi tình trạng đất đai nông nghiệp, lịch tưới tiêu tự động và tiến độ canh tác của bạn trên nền tảng PlotFarm.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 border-0 shadow-sm"
                  onClick={() => setIsRegisterPlotModalOpen(true)}
                >
                  + Đăng ký Thửa Đất Mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  className="bg-emerald-600/50 border border-emerald-400/40 text-emerald-700 hover:bg-emerald-600"
                  onClick={() => setIsWeatherModalOpen(true)}
                >
                  Xem Báo Cáo Thời Tiết
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid using StatCard */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Thửa đất sở hữu"
              value={`${plots.length} Thửa`}
              subtext="Tổng diện tích: 12.500 m²"
              subtextClassName="text-emerald-600 font-medium"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              iconBgColor="bg-emerald-100 text-emerald-600"
            />

            <StatCard
              title="Mùa vụ hiện tại"
              value="Vụ Hè Thu"
              subtext="Giai đoạn: Chuẩn bị thu hoạch"
              subtextClassName="text-amber-600 font-medium"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconBgColor="bg-amber-100 text-amber-600"
            />

            <StatCard
              title="Cảm biến IoT Đất"
              value="72% Độ ẩm"
              subtext="Nhiệt độ 27.5°C • pH 6.4 (Tốt)"
              subtextClassName="text-blue-600 font-medium"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              iconBgColor="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="Tình trạng tài khoản"
              value="Đang hoạt động"
              valueClassName="text-emerald-600"
              subtext={`Quyền: Customer (${user?.username || "customer"})`}
              subtextClassName="text-gray-500 font-medium"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              iconBgColor="bg-emerald-100 text-emerald-600"
            />
          </div>

          {/* Quick Details Table / Active Plots using Card & Badge */}
          <Card>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Danh sách Thửa Đất của bạn
              </h2>
              <span className="text-xs text-gray-500">Cập nhật lúc: 13:40 hôm nay</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Mã thửa</th>
                    <th className="px-6 py-3">Khu vực canh tác</th>
                    <th className="px-6 py-3">Loại cây trồng</th>
                    <th className="px-6 py-3">Diện tích</th>
                    <th className="px-6 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {plots.map((plot) => (
                    <tr key={plot.id}>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {plot.code}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{plot.areaName}</td>
                      <td className="px-6 py-4 text-gray-600">{plot.cropType}</td>
                      <td className="px-6 py-4 text-gray-600">{plot.size}</td>
                      <td className="px-6 py-4">
                        {plot.status === "needs_water" ? (
                          <Badge variant="warning" size="sm">
                            {plot.statusText}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            {plot.statusText}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* Modal Đăng Ký Thửa Đất */}
      <Modal
        isOpen={isRegisterPlotModalOpen}
        onClose={() => setIsRegisterPlotModalOpen(false)}
        title="Đăng ký thêm thửa đất mới"
        description="Nhập thông tin thửa đất nông nghiệp để kết nối với hệ thống bản đồ số và cảm biến PlotFarm."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsRegisterPlotModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleAddPlot}
            >
              Lưu thửa đất
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tên khu vực / Tên thửa"
            placeholder="Ví dụ: Khu Đồng Xanh - Thửa B2"
            value={newPlotName}
            onChange={(e) => setNewPlotName(e.target.value)}
          />

          <div className="space-y-1.5 text-xs text-gray-700">
            <label className="block font-medium">Loại cây trồng canh tác:</label>
            <select
              value={newPlotCrop}
              onChange={(e) => setNewPlotCrop(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="Lúa ST25 Đặc sản">Lúa ST25 Đặc sản</option>
              <option value="Cà phê Robusta">Cà phê Robusta</option>
              <option value="Rau củ hữu cơ cao cấp">Rau củ hữu cơ cao cấp</option>
              <option value="Cây ăn trái (Sầu riêng, Xoài)">Cây ăn trái (Sầu riêng, Xoài)</option>
            </select>
          </div>

          <Input
            label="Diện tích (m²)"
            type="number"
            placeholder="Ví dụ: 5000"
            value={newPlotArea}
            onChange={(e) => setNewPlotArea(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal Báo Cáo Thời Tiết */}
      <Modal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        title="Trung tâm dữ liệu thời tiết nông vụ"
        description="Thông số khí hậu và dự báo thời tiết trực quan từ trạm khí tượng vệ tinh."
        footer={
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setIsWeatherModalOpen(false)}
          >
            Đóng
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-900">29°C</span>
              <p className="text-emerald-700 font-medium">Nắng dịu, thuận lợi bón phân</p>
            </div>
            <span className="text-4xl">☀️</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-gray-200">
              <span className="text-gray-400 block text-2xs uppercase">Độ ẩm không khí</span>
              <span className="text-sm font-bold text-gray-800">65%</span>
            </div>
            <div className="p-3 rounded-lg border border-gray-200">
              <span className="text-gray-400 block text-2xs uppercase">Lượng mưa dự kiến</span>
              <span className="text-sm font-bold text-gray-800">0.0 mm</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
