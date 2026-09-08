import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";

type AdminTab = "dashboard" | "users" | "plots" | "devices" | "settings";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const menuItems: { id: AdminTab; label: string; icon: string; badge?: string }[] = [
    { id: "dashboard", label: "Bảng điều khiển hệ thống", icon: "🖥️" },
    { id: "users", label: "Quản lý người dùng", icon: "👥", badge: "1.250" },
    { id: "plots", label: "Quản lý thửa đất hệ thống", icon: "🗺️", badge: "140 thửa" },
    { id: "devices", label: "Giám sát thiết bị IoT", icon: "📡", badge: "320 online" },
    { id: "settings", label: "Cấu hình hệ thống & API", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold">
            PF
          </div>
          <span className="font-bold text-base">PlotFarm Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-200"
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar for Admin */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-68 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Admin Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-emerald-500 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">PlotFarm</span>
                <span className="block text-2xs uppercase tracking-wider font-semibold text-indigo-400">
                  Admin Portal
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-2xs uppercase tracking-wider text-slate-400 font-semibold">
              Quản Trị Hệ Thống
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
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
                        ? "bg-indigo-800 text-indigo-100"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Server status & Admin Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="rounded-lg bg-slate-800/80 p-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Máy chủ trung tâm:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              99.9% Online
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              AD
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.fullName || user?.username || "Admin"}
              </p>
              <p className="text-2xs text-slate-400 truncate">{user?.email || "admin@plotfarm.com"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-red-700 text-slate-200 hover:text-white py-2 px-3 text-xs font-medium transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất Admin</span>
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
              Quản trị toàn diện nền tảng số hóa nông nghiệp PlotFarm
            </p>
          </div>

          {/* Search bar & quick action */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm user, thửa đất..."
                className="w-48 sm:w-64 rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <svg className="h-4 w-4 text-gray-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => alert("Đang xuất báo cáo tổng quan hệ thống...")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs transition cursor-pointer"
            >
              Xuất báo cáo
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Tổng người dùng</span>
                    <span className="rounded-md bg-indigo-100 p-2 text-indigo-700">👥</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">1.250</p>
                  <p className="text-xs text-indigo-600 mt-1">980 Khách hàng • 270 Nông dân</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Thửa đất số hóa</span>
                    <span className="rounded-md bg-emerald-100 p-2 text-emerald-700">🗺️</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">140 Thửa</p>
                  <p className="text-xs text-emerald-600 mt-1">Tổng 85.000 m² trên bản đồ GIS</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Thiết bị IoT kết nối</span>
                    <span className="rounded-md bg-blue-100 p-2 text-blue-700">📡</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">320 Trạm</p>
                  <p className="text-xs text-blue-600 mt-1">315 trực tuyến • 5 cần kiểm tra</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Độ tin cậy hệ thống</span>
                    <span className="rounded-md bg-emerald-100 p-2 text-emerald-700">🛡️</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">99.98%</p>
                  <p className="text-xs text-gray-500 mt-1">Thời gian phản hồi: 45ms</p>
                </div>
              </div>

              {/* User management preview table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Danh sách tài khoản hệ thống gần đây
                    </h2>
                    <p className="text-xs text-gray-500">Phân quyền theo vai trò Customer, Farmer, Admin</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Người dùng</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Vai trò (Role)</th>
                        <th className="px-6 py-3">Trạng thái</th>
                        <th className="px-6 py-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">AD</span>
                          Trần Quản Trị
                        </td>
                        <td className="px-6 py-4 text-gray-600">admin@plotfarm.com</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                            👑 Admin
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-medium text-xs">Đang hoạt động</td>
                        <td className="px-6 py-4 text-xs text-gray-400">Không thể sửa</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">FM</span>
                          Lê Văn Canh Tác
                        </td>
                        <td className="px-6 py-4 text-gray-600">farmer@plotfarm.com</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            🚜 Farmer
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-medium text-xs">Đang hoạt động</td>
                        <td className="px-6 py-4 text-xs text-indigo-600 font-medium hover:underline cursor-pointer">Chi tiết</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">KH</span>
                          Nguyễn Văn Nông
                        </td>
                        <td className="px-6 py-4 text-gray-600">customer@plotfarm.com</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                            👤 Customer
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-medium text-xs">Đang hoạt động</td>
                        <td className="px-6 py-4 text-xs text-indigo-600 font-medium hover:underline cursor-pointer">Chi tiết</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab !== "dashboard" && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl mb-3">
                {menuItems.find((i) => i.id === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {menuItems.find((i) => i.id === activeTab)?.label}
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                Mô-đun quản trị đang hoạt động bình thường và kết nối với cơ sở dữ liệu hệ thống máy chủ PlotFarm.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition"
              >
                Quay lại Bảng điều khiển
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
