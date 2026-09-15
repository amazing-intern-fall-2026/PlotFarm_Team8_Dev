import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout, fetchCurrentUser } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Sidebar, UserDropdownMenu, type SidebarMenuItem } from "../../components/layout";
import { Modal, Button } from "../../components/ui";
import ChangePasswordModal from "../auth/ChangePasswordModal";

// Admin Module Components
import AdminDashboard from "./AdminDashboard";
import AdminFarmsPlots from "./AdminFarmsPlots";
import AdminContracts from "./AdminContracts";
import AdminCareRequests from "./AdminCareRequests";
import AdminHarvestDelivery from "./AdminHarvestDelivery";
import AdminUsers from "./AdminUsers";
import AdminProfile from "./AdminProfile";
import { adminService } from "./admin.service";
import type { AdminKPIData } from "./admin.types";

export type AdminTab = "dashboard" | "farms-plots" | "contracts" | "requests" | "harvest" | "users" | "profile";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout: authLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState(() => authUser || getCurrentUser());
  const user = currentUser;

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [kpiSummary, setKpiSummary] = useState<AdminKPIData | null>(null);

  // Sync active tab from URL path
  const activeTab: AdminTab = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/admin/farms-plots") || path.includes("/admin/plots") || path.includes("/admin/farms"))
      return "farms-plots";
    if (path.includes("/admin/contracts")) return "contracts";
    if (path.includes("/admin/requests")) return "requests";
    if (path.includes("/admin/harvest")) return "harvest";
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/profile")) return "profile";
    return "dashboard";
  })();

  // Load KPI for badges and fresh user profile
  useEffect(() => {
    let isMounted = true;
    fetchCurrentUser()
      .then((u) => {
        if (isMounted && u) setCurrentUser(u);
      })
      .catch(() => null);

    adminService
      .fetchKPI()
      .then((data) => {
        if (isMounted) setKpiSummary(data);
      })
      .catch((err) => console.error("Failed to fetch admin sidebar KPI:", err));

    function handleSync() {
      setCurrentUser(getCurrentUser());
    }
    window.addEventListener("pf_admin_profile_changed", handleSync);
    window.addEventListener("pf_auth_changed", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("pf_admin_profile_changed", handleSync);
      window.removeEventListener("pf_auth_changed", handleSync);
    };
  }, []);

  function handleTabChange(tab: AdminTab) {
    if (tab === "dashboard") {
      navigate("/admin");
    } else {
      navigate(`/admin/${tab}`);
    }
  }

  function handleLogout() {
    authLogout();
    logout();
    navigate("/login", { replace: true });
  }

  const pendingRequestsCount =
    kpiSummary?.pendingCareRequests ?? kpiSummary?.careRequestPending ?? 0;
  const totalPlotsCount = kpiSummary?.totalPlots ?? kpiSummary?.tongSoPlot;

  const menuItems: SidebarMenuItem<AdminTab>[] = [
    { id: "dashboard", label: "Bảng điều khiển hệ thống", icon: "🖥️" },
    {
      id: "farms-plots",
      label: "Nông trại & Thửa đất",
      icon: "🌱",
      badge: totalPlotsCount ? `${totalPlotsCount} thửa` : undefined,
    },
    { id: "contracts", label: "Hợp đồng thuê đất", icon: "📜" },
    {
      id: "requests",
      label: "Yêu cầu chăm sóc",
      icon: "💬",
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} chờ` : undefined,
    },
    { id: "harvest", label: "Thu hoạch & Giao hàng", icon: "🌾" },
    { id: "users", label: "Quản lý người dùng", icon: "👥" },
    { id: "profile", label: "Hồ sơ Quản Trị Viên", icon: "👤" },
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
        onTabChange={handleTabChange}
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
        onUserProfileClick={() => handleTabChange("profile")}
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
              Quản trị toàn diện nền tảng số hóa nông nghiệp PlotFarm — Phiên bản 2.0
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-2xs border-0 text-xs"
              onClick={() => setIsExportModalOpen(true)}
            >
              📥 Xuất báo cáo tổng hợp
            </Button>

            {/* Polished User Dropdown Menu */}
            <UserDropdownMenu
              user={{
                name: user?.fullName || user?.username || "Admin",
                username: user?.username,
                email: user?.email || "admin@plotfarm.com",
                phone: (user as any)?.phone,
                roleBadge: "Quản Trị Viên Hệ Thống",
                roleTitle: "Quản Trị Viên • Admin",
                avatarText: "AD",
                avatarBg: "bg-slate-900 text-white",
              }}
              theme="slate"
              isActiveProfile={activeTab === "profile"}
              onProfileClick={() => handleTabChange("profile")}
              onChangePasswordClick={() => setIsPasswordModalOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Content Body Rendering Required Tab */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <AdminDashboard onNavigateTab={handleTabChange} />
          )}

          {activeTab === "farms-plots" && <AdminFarmsPlots />}

          {activeTab === "contracts" && <AdminContracts />}

          {activeTab === "requests" && <AdminCareRequests />}

          {activeTab === "harvest" && <AdminHarvestDelivery />}

          {activeTab === "users" && <AdminUsers />}

          {activeTab === "profile" && (
            <AdminProfile
              onNavigateUsers={() => handleTabChange("users")}
              onNavigateFarms={() => handleTabChange("farms-plots")}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Modal Xuất Báo Cáo */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Xuất báo cáo tổng quan hệ thống PlotFarm"
        description="Chọn định dạng dữ liệu bạn muốn kết xuất trực tiếp từ máy chủ."
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
                alert("Báo cáo hệ thống đã được tạo thành công và sẵn sàng lưu về máy!");
                setIsExportModalOpen(false);
              }}
            >
              Tải báo cáo (.xlsx)
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-gray-700">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-indigo-950">
            Báo cáo trích xuất trực tiếp bao gồm <strong>{totalPlotsCount ?? 140} thửa đất</strong>,{" "}
            <strong>{kpiSummary?.totalFarms ?? 4} nông trại</strong>, hợp đồng và tình hình thực thi yêu cầu chăm sóc.
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-800">Định dạng file kết xuất:</label>
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

      {/* Change Password Modal accessible directly from header */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmailOrName={user?.fullName || user?.username || "Admin"}
      />
    </div>
  );
}

