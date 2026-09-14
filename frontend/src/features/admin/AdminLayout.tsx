import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import {
  Sidebar,
  type SidebarMenuItem,
} from "../../components/layout";
import {
  StatCard,
  Badge,
  EmptyState,
  Modal,
  Button,
  Card,
} from "../../components/ui";

type AdminTab = "dashboard" | "users" | "plots" | "devices" | "settings";

interface UserTableRow {
  id: string;
  name: string;
  avatarText: string;
  email: string;
  role: "admin" | "farmer" | "customer";
  status: "active" | "inactive";
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();
  const user = authUser || getCurrentUser();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);

  function handleLogout() {
    authLogout();
    logout();
    navigate("/login", { replace: true });
  }

  const menuItems: SidebarMenuItem<AdminTab>[] = [
    { id: "dashboard", label: "Bảng điều khiển hệ thống", icon: "🖥️" },
    { id: "users", label: "Quản lý người dùng", icon: "👥", badge: "1.250" },
    { id: "plots", label: "Quản lý thửa đất hệ thống", icon: "🗺️", badge: "140 thửa" },
    { id: "devices", label: "Giám sát thiết bị IoT", icon: "📡", badge: "320 online" },
    { id: "settings", label: "Cấu hình hệ thống & API", icon: "⚙️" },
  ];

  const recentUsers: UserTableRow[] = [
    {
      id: "1",
      name: "Trần Quản Trị",
      avatarText: "AD",
      email: "admin@plotfarm.com",
      role: "admin",
      status: "active",
    },
    {
      id: "2",
      name: "Lê Văn Canh Tác",
      avatarText: "FM",
      email: "farmer@plotfarm.com",
      role: "farmer",
      status: "active",
    },
    {
      id: "3",
      name: "Nguyễn Văn Nông",
      avatarText: "KH",
      email: "customer@plotfarm.com",
      role: "customer",
      status: "active",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Standardized Reusable Admin Sidebar */}
      <Sidebar<AdminTab>
        theme="slate"
        brandTitle="PlotFarm"
        brandSubtitle="Admin Portal"
        brandShortName="PF"
        menuSectionTitle="Quản Trị Hệ Thống"
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={setIsMobileSidebarOpen}
        user={{
          name: user?.fullName || user?.username || "Admin",
          emailOrStatus: user?.email || "admin@plotfarm.com",
          avatarText: "AD",
        }}
        extraFooterWidget={
          <div className="rounded-lg bg-slate-800/80 p-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Máy chủ trung tâm:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              99.9% Online
            </span>
          </div>
        }
        onLogout={handleLogout}
        logoutText="Đăng xuất Admin"
      />

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
              <svg
                className="h-4 w-4 text-gray-400 absolute left-2.5 top-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-2xs border-0"
              onClick={() => setIsExportModalOpen(true)}
            >
              Xuất báo cáo
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid using StatCard */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Tổng người dùng"
                  value="1.250"
                  subtext="980 Khách hàng • 270 Nông dân"
                  subtextClassName="text-indigo-600"
                  icon="👥"
                  iconBgColor="bg-indigo-100 text-indigo-700"
                />

                <StatCard
                  title="Thửa đất số hóa"
                  value="140 Thửa"
                  subtext="Tổng 85.000 m² trên bản đồ GIS"
                  subtextClassName="text-emerald-600"
                  icon="🗺️"
                  iconBgColor="bg-emerald-100 text-emerald-700"
                />

                <StatCard
                  title="Thiết bị IoT kết nối"
                  value="320 Trạm"
                  subtext="315 trực tuyến • 5 cần kiểm tra"
                  subtextClassName="text-blue-600"
                  icon="📡"
                  iconBgColor="bg-blue-100 text-blue-700"
                />

                <StatCard
                  title="Độ tin cậy hệ thống"
                  value="99.98%"
                  subtext="Thời gian phản hồi: 45ms"
                  valueClassName="text-emerald-600"
                  icon="🛡️"
                  iconBgColor="bg-emerald-100 text-emerald-700"
                />
              </div>

              {/* User management preview table using Card & Badge */}
              <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Danh sách tài khoản hệ thống gần đây
                    </h2>
                    <p className="text-xs text-gray-500">
                      Phân quyền theo vai trò Customer, Farmer, Admin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
                      {recentUsers.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                            <span
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                item.role === "admin"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : item.role === "farmer"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-teal-100 text-teal-700"
                              }`}
                            >
                              {item.avatarText}
                            </span>
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.email}</td>
                          <td className="px-6 py-4">
                            {item.role === "admin" && (
                              <Badge variant="indigo" size="sm">
                                👑 Admin
                              </Badge>
                            )}
                            {item.role === "farmer" && (
                              <Badge variant="success" size="sm">
                                🚜 Farmer
                              </Badge>
                            )}
                            {item.role === "customer" && (
                              <Badge variant="info" size="sm">
                                👤 Customer
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-emerald-600 font-medium text-xs">
                              Đang hoạt động
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {item.role === "admin" ? (
                              <span className="text-gray-400">Không thể sửa</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedUser(item)}
                                className="text-indigo-600 font-medium hover:underline cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* Sub-tabs placeholder using EmptyState */}
          {activeTab !== "dashboard" && (
            <EmptyState
              icon={menuItems.find((i) => i.id === activeTab)?.icon}
              title={menuItems.find((i) => i.id === activeTab)?.label}
              description="Mô-đun quản trị đang hoạt động bình thường và kết nối trực tiếp với cơ sở dữ liệu hệ thống máy chủ PlotFarm."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setActiveTab("dashboard")}
                >
                  Quay lại Bảng điều khiển
                </Button>
              }
            />
          )}
        </main>
      </div>

      {/* Modal Xuất Báo Cáo */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Xuất báo cáo tổng quan hệ thống"
        description="Chọn định dạng và phạm vi dữ liệu bạn muốn kết xuất từ cơ sở dữ liệu PlotFarm."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsExportModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                alert("Báo cáo hệ thống đã được tạo thành công và tải về!");
                setIsExportModalOpen(false);
              }}
            >
              Tải báo cáo (Excel/CSV)
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
            Báo cáo sẽ bao gồm dữ liệu phân tích của <strong>1.250 tài khoản</strong>, <strong>140 thửa đất</strong> và <strong>320 trạm cảm biến IoT</strong> trong 30 ngày qua.
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <label className="block font-medium text-gray-700">Định dạng kết xuất:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="exportFormat" defaultChecked />
                <span>Microsoft Excel (.xlsx)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="exportFormat" />
                <span>CSV File (.csv)</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Chi Tiết Người Dùng */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Thông tin chi tiết tài khoản"
        description="Xem xét và quản lý phân quyền người dùng trong hệ thống PlotFarm."
        footer={
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setSelectedUser(null)}
          >
            Đóng
          </Button>
        }
      >
        {selectedUser && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {selectedUser.avatarText}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{selectedUser.name}</p>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-2xs uppercase font-medium">Vai trò</span>
                <span className="font-semibold text-gray-800 capitalize">{selectedUser.role}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-2xs uppercase font-medium">Trạng thái</span>
                <span className="font-semibold text-emerald-600">Hoạt động bình thường</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
