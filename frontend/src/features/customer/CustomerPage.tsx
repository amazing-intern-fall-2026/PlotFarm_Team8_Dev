import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";

export default function CustomerPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [notification, setNotification] = useState<string | null>(
    "Đăng nhập thành công! Chào mừng bạn đến với Cổng thông tin Khách hàng PlotFarm.",
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Plot<span className="text-emerald-600">Farm</span>
              </span>
              <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Customer Portal
              </span>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 text-right">
              <div className="h-9 w-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                {(user?.fullName || user?.username || "C").charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.fullName || user?.username || "Khách hàng"}
                </p>
                <p className="text-xs text-gray-500">{user?.email || "customer@plotfarm.com"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Welcome Alert */}
          {notification && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-semibold text-sm">Chào mừng bạn đã trở lại!</h2>
                  <p className="text-xs text-emerald-700">{notification}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
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
                <button
                  type="button"
                  onClick={() => alert("Tính năng thêm thửa đất đang mở kết nối bản đồ GIS!")}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 transition cursor-pointer"
                >
                  + Đăng ký Thửa Đất Mới
                </button>
                <button
                  type="button"
                  onClick={() => alert("Đang kết nối trung tâm thời tiết nông vụ!")}
                  className="rounded-lg bg-emerald-600/50 border border-emerald-400/40 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition cursor-pointer"
                >
                  Xem Báo Cáo Thời Tiết
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thửa đất sở hữu</p>
                <span className="rounded-md bg-emerald-100 p-2 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">3 Thửa</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Tổng diện tích: 12.500 m²</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mùa vụ hiện tại</p>
                <span className="rounded-md bg-amber-100 p-2 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">Vụ Hè Thu</p>
              <p className="mt-1 text-xs text-amber-600 font-medium">Giai đoạn: Chuẩn bị thu hoạch</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cảm biến IoT Đất</p>
                <span className="rounded-md bg-blue-100 p-2 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">72% Độ ẩm</p>
              <p className="mt-1 text-xs text-blue-600 font-medium">Nhiệt độ 27.5°C • pH 6.4 (Tốt)</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng tài khoản</p>
                <span className="rounded-md bg-emerald-100 p-2 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-emerald-600">Đang hoạt động</p>
              <p className="mt-1 text-xs text-gray-500 font-medium">Quyền: Customer ({user?.username})</p>
            </div>
          </div>

          {/* Quick Details Table / Active Plots */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
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
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">#PL-0192</td>
                    <td className="px-6 py-4 text-gray-600">Khu Đồng Xanh - Thửa A1</td>
                    <td className="px-6 py-4 text-gray-600">Lúa ST25 Đặc sản</td>
                    <td className="px-6 py-4 text-gray-600">5.000 m²</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Phát triển tốt
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">#PL-0205</td>
                    <td className="px-6 py-4 text-gray-600">Khu Thung Lũng - Thửa B4</td>
                    <td className="px-6 py-4 text-gray-600">Cà phê Robusta</td>
                    <td className="px-6 py-4 text-gray-600">4.500 m²</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Đang ra hoa
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">#PL-0311</td>
                    <td className="px-6 py-4 text-gray-600">Khu Vườn Ươm - Thửa C2</td>
                    <td className="px-6 py-4 text-gray-600">Rau củ hữu cơ cao cấp</td>
                    <td className="px-6 py-4 text-gray-600">3.000 m²</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Cần tưới nước
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
