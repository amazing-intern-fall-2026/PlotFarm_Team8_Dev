import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, fetchCurrentUser } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Sidebar, UserDropdownMenu, type SidebarMenuItem } from "../../components/layout";
import ChangePasswordModal from "../auth/ChangePasswordModal";
import CustomerDashboard from "./CustomerDashboard";
import CustomerPlots from "./CustomerPlots";
import CustomerLogs from "./CustomerLogs";
import CustomerRequests from "./CustomerRequests";
import CustomerHarvest from "./CustomerHarvest";
import FarmListPage from "./FarmListPage";
import CustomerProfile from "./CustomerProfile";
import { customerService } from "./customer.service";
import type { CustomerTab, SharedCustomerProfile } from "./customer.types";

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout: authLogout } = useAuth();
  const [currentUser, setCurrentUser] = useState(() => authUser || getCurrentUser());
  const user = currentUser;

  const [activeCustomer, setActiveCustomer] = useState<SharedCustomerProfile>(() =>
    customerService.getActiveCustomerProfile(),
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [, setSyncKey] = useState(0);

  // Sync state whenever customer or data changes
  useEffect(() => {
    let isMounted = true;
    async function initLayoutData() {
      try {
        await Promise.all([
          fetchCurrentUser().catch(() => null),
          customerService.fetchMyContractsAsync(),
          customerService.fetchFarmingLogsAsync(),
          customerService.fetchMyCareRequestsAsync(),
          customerService.fetchMyHarvestsAsync(),
        ]);
        if (isMounted) {
          setCurrentUser(getCurrentUser());
          setActiveCustomer(customerService.getActiveCustomerProfile());
          setSyncKey((prev) => prev + 1);
        }
      } catch (err) {
        console.warn("Lỗi khi tải dữ liệu badge:", err);
      }
    }
    initLayoutData();

    function handleSync() {
      setCurrentUser(getCurrentUser());
      setActiveCustomer(customerService.getActiveCustomerProfile());
      setSyncKey((prev) => prev + 1);
    }
    window.addEventListener("pf_data_changed", handleSync);
    window.addEventListener("pf_farmer_changed", handleSync);
    window.addEventListener("pf_auth_changed", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("pf_data_changed", handleSync);
      window.removeEventListener("pf_farmer_changed", handleSync);
      window.removeEventListener("pf_auth_changed", handleSync);
    };
  }, []);

  // Determine active tab directly from URL pathname
  const activeTab: CustomerTab = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/customer/plots")) return "plots";
    if (path.includes("/customer/logs")) return "logs";
    if (path.includes("/customer/requests")) return "requests";
    if (path.includes("/customer/harvest")) return "harvest";
    if (path.includes("/customer/farms")) return "farms";
    if (path.includes("/customer/profile")) return "profile";
    return "dashboard";
  })();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [requestTargetPlot, setRequestTargetPlot] = useState<string | undefined>(undefined);

  function handleTabChange(tab: CustomerTab) {
    if (tab === "dashboard") {
      navigate("/customer");
    } else {
      navigate(`/customer/${tab}`);
    }
  }

  function handleLogout() {
    authLogout();
    navigate("/", { replace: true });
  }

  function handleOpenCreateRequest(plotCode?: string) {
    setRequestTargetPlot(plotCode);
    handleTabChange("requests");
  }

  // Dynamic badges for Customer navigation
  const myPlotsCount = customerService.getMyPlots(activeCustomer.id).length;
  const pendingRequestsCount = customerService
    .getMyCareRequests(activeCustomer.id)
    .filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length;
  const pendingHarvestsCount = customerService
    .getMyHarvests(activeCustomer.id)
    .filter((h) => h.harvestStatus === "SCHEDULED").length;

  const menuItems: SidebarMenuItem<CustomerTab>[] = [
    { id: "dashboard", label: "Tổng quan Nông vụ", icon: "📊" },
    {
      id: "plots",
      label: "Thửa đất & Hợp đồng",
      icon: "🌱",
      badge: `${myPlotsCount} thửa`,
    },
    { id: "logs", label: "Nhật ký Canh tác", icon: "📝" },
    {
      id: "requests",
      label: "Yêu cầu Chăm sóc",
      icon: "💬",
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} chờ` : undefined,
    },
    {
      id: "harvest",
      label: "Thu hoạch & Giao hàng",
      icon: "🌾",
      badge: pendingHarvestsCount > 0 ? `${pendingHarvestsCount} vụ` : undefined,
    },
    { id: "farms", label: "Khám phá Nông trại", icon: "🏡" },
    { id: "profile", label: "Hồ sơ Khách Hàng", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar for Customer */}
      <Sidebar<CustomerTab>
        theme="emerald"
        brandTitle="PlotFarm"
        brandSubtitle="Cổng Khách Hàng"
        brandShortName="PF"
        menuSectionTitle="Dịch Vụ Nông Trại"
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={setIsMobileSidebarOpen}
        user={{
          name: user?.fullName || activeCustomer.name || user?.username || "Khách Hàng",
          emailOrStatus: user?.email || activeCustomer.email || "customer@plotfarm.com",
          avatarText: activeCustomer.avatarIcon || "👨‍💼",
        }}
        extraFooterWidget={
          <div className="rounded-lg bg-emerald-950/60 p-2.5 flex items-center justify-between text-2xs text-emerald-200 border border-emerald-800/40">
            <span>Thửa đất đang thuê:</span>
            <strong className="text-white">{myPlotsCount} thửa</strong>
          </div>
        }
        onLogout={handleLogout}
        logoutText="Đăng xuất"
        onUserProfileClick={() => handleTabChange("profile")}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">
              Cổng giám sát & yêu cầu canh tác nông nghiệp thông minh PlotFarm
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Polished User Dropdown Menu */}
            <UserDropdownMenu
              user={{
                name: user?.fullName || activeCustomer.name || user?.username || "Khách Hàng",
                username: user?.username,
                email: user?.email || activeCustomer.email,
                phone: (user as any)?.phone || activeCustomer.phone,
                roleBadge: "Khách Hàng Thành Viên",
                roleTitle: "Khách Hàng • Hồ sơ",
                avatarText: activeCustomer.avatarIcon || (user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : "KH"),
                avatarBg: "bg-linear-to-tr from-emerald-600 to-teal-400 text-white",
              }}
              theme="emerald"
              isActiveProfile={activeTab === "profile"}
              onProfileClick={() => handleTabChange("profile")}
              onChangePasswordClick={() => setIsPasswordModalOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <CustomerDashboard
              onNavigateTab={handleTabChange}
              onOpenCreateRequest={handleOpenCreateRequest}
            />
          )}

          {activeTab === "plots" && (
            <CustomerPlots
              onOpenCreateRequest={handleOpenCreateRequest}
              onNavigateFarms={() => handleTabChange("farms")}
            />
          )}

          {activeTab === "logs" && <CustomerLogs />}

          {activeTab === "requests" && (
            <CustomerRequests initialPlotCode={requestTargetPlot} />
          )}

          {activeTab === "harvest" && <CustomerHarvest />}

          {activeTab === "farms" && (
            <FarmListPage
              isEmbedded={true}
              onSelectFarm={(farmId: string) => navigate(`/customer/farms/${farmId}`)}
            />
          )}

          {activeTab === "profile" && (
            <CustomerProfile
              onNavigatePlots={() => handleTabChange("plots")}
              onNavigateRequests={() => handleTabChange("requests")}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Change Password Modal accessible directly from header */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmailOrName={user?.fullName || activeCustomer.name || user?.email}
      />
    </div>
  );
}
