import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";

type FarmerTab = "dashboard" | "plots" | "schedule" | "logs" | "requests";

export default function FarmerLayout() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<FarmerTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const menuItems: { id: FarmerTab; label: string; icon: string; badge?: string }[] = [
    { id: "dashboard", label: "Tổng quan nông vụ", icon: "📊" },
    { id: "plots", label: "Thửa ruộng phụ trách", icon: "🌱", badge: "4 thửa" },
    { id: "schedule", label: "Lịch tưới & Bón phân", icon: "📅", badge: "3 lịch hôm nay" },
    { id: "logs", label: "Nhật ký mùa vụ & Sâu bệnh", icon: "📝" },
    { id: "requests", label: "Yêu cầu từ khách hàng", icon: "💬", badge: "2 mới" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-emerald-800 text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold">
            PF
          </div>
          <span className="font-bold text-base">PlotFarm Farmer</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
          className="p-1.5 rounded-md hover:bg-emerald-700 text-emerald-100"
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar for Farmer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-white flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">PlotFarm</span>
                <span className="block text-2xs uppercase tracking-wider font-semibold text-emerald-300">
                  Cổng Nông Dân
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-emerald-300 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-2xs uppercase tracking-wider text-emerald-400 font-semibold">
              Khu Vực Canh Tác
            </div>
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  activeTab === item.id
                    ? "bg-emerald-700 text-white shadow-sm font-semibold"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-2xs px-2 py-0.5 rounded-full font-medium ${
                      activeTab === item.id
                        ? "bg-emerald-900 text-emerald-200"
                        : "bg-emerald-800 text-emerald-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Farmer Profile Footer */}
        <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              👨‍🌾
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.username || "Nông Dân"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs text-emerald-300">Đang trực đồng ruộng</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-800/80 hover:bg-red-700 text-emerald-100 hover:text-white py-2 px-3 text-xs font-medium transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">
              Phụ trách cụm thửa ruộng Đồng Xanh & Thung Lũng
            </p>
          </div>

          {/* Weather & IoT sensor widget */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
              <span className="text-base">☀️</span>
              <div>
                <span className="font-semibold">29°C Nắng tốt</span>
                <span className="text-gray-500 ml-1.5">• Độ ẩm đất: 68%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Đang mở form ghi nhận nhật ký nông vụ tức thời...")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs transition cursor-pointer"
            >
              + Ghi nhật ký
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Quick KPI stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Thửa phụ trách</span>
                    <span className="rounded-md bg-emerald-100 p-2 text-emerald-700">🌱</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">4 Thửa</p>
                  <p className="text-xs text-emerald-600 mt-1">Diện tích: 18.000 m²</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Việc cần làm hôm nay</span>
                    <span className="rounded-md bg-amber-100 p-2 text-amber-700">📋</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">3 Nhiệm vụ</p>
                  <p className="text-xs text-amber-600 mt-1">2 việc cần hoàn thành trước 16h</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Tình trạng cây trồng</span>
                    <span className="rounded-md bg-blue-100 p-2 text-blue-700">🌾</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">Bình thường</p>
                  <p className="text-xs text-blue-600 mt-1">Không phát hiện dịch hại</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Yêu cầu từ khách</span>
                    <span className="rounded-md bg-purple-100 p-2 text-purple-700">💬</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-purple-700">2 Yêu cầu</p>
                  <p className="text-xs text-gray-500 mt-1">Cần chụp ảnh tiến độ lúa</p>
                </div>
              </div>

              {/* Tasks schedule */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Lịch trình canh tác & chăm sóc trong ngày
                  </h2>
                  <span className="text-xs text-emerald-700 font-medium">Hôm nay: Vụ Hè Thu</span>
                </div>
                <div className="divide-y divide-gray-200">
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded text-emerald-600" defaultChecked />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-through text-gray-500">
                          Bón thúc phân Kali & Lân đợt 2 (Thửa #PL-0192)
                        </p>
                        <p className="text-xs text-gray-400">Thời gian: 07:00 - Hoàn thành bởi Nông dân</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Đã xong
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Vận hành hệ thống tưới phun sương (Thửa #PL-0311 - Rau hữu cơ)
                        </p>
                        <p className="text-xs text-gray-500">Thời gian: 15:30 - Khách hàng yêu cầu kiểm tra độ ẩm</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Chờ thực hiện
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Chụp ảnh tiến độ lúa ST25 gửi chủ thửa đất #PL-0192
                        </p>
                        <p className="text-xs text-gray-500">Thời gian: 17:00 - Đính kèm báo cáo tuần</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Chờ thực hiện
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab !== "dashboard" && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl mb-3">
                {menuItems.find((i) => i.id === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {menuItems.find((i) => i.id === activeTab)?.label}
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                Dữ liệu chi tiết cho phân hệ nông vụ đang được kết nối với trạm trung tâm IoT và dữ liệu cảm biến thực địa.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
              >
                Quay lại Tổng quan
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
