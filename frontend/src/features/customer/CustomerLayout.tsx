import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Sidebar, type SidebarMenuItem } from "../../components/layout";
import CustomerDashboard from "./CustomerDashboard";
import CustomerPlots from "./CustomerPlots";
import CustomerLogs from "./CustomerLogs";
import CustomerRequests from "./CustomerRequests";
import CustomerHarvest from "./CustomerHarvest";
import FarmListPage from "./FarmListPage";
import { customerService } from "./customer.service";
import type { CustomerTab, SharedCustomerProfile } from "./customer.types";

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout: authLogout } = useAuth();
  const user = authUser || getCurrentUser();

  const [activeCustomer, setActiveCustomer] = useState<SharedCustomerProfile>(() =>
    customerService.getActiveCustomerProfile(),
  );

  // Sync state whenever customer or data changes
  useEffect(() => {
    function handleSync() {
      setActiveCustomer(customerService.getActiveCustomerProfile());
    }
    window.addEventListener("pf_data_changed", handleSync);
    window.addEventListener("pf_farmer_changed", handleSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleSync);
      window.removeEventListener("pf_farmer_changed", handleSync);
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
    logout();
    navigate("/login", { replace: true });
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
          name: user?.fullName || activeCustomer.name || "Khách Hàng",
          emailOrStatus: user?.email || activeCustomer.email || "",
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
              onSelectFarm={(farmId) => navigate(`/customer/farms/${farmId}`)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
