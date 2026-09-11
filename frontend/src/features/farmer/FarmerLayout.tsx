import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Sidebar, type SidebarMenuItem } from "../../components/layout";
import FarmerDashboard from "./FarmerDashboard";
import FarmerPlots from "./FarmerPlots";
import FarmerLogs from "./FarmerLogs";
import FarmerRequests from "./FarmerRequests";
import FarmerHarvest from "./FarmerHarvest";
import FarmerProfile from "./FarmerProfile";
import { farmerService } from "./farmer.service";
import type { FarmerProfileData } from "./farmer.types";

export type FarmerTab = "dashboard" | "plots" | "logs" | "requests" | "harvest" | "profile";

export default function FarmerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const [activeProfile, setActiveProfile] = useState<FarmerProfileData>(() =>
    farmerService.getFarmerProfile(),
  );
  const [, setTick] = useState(0);

  // Sync state whenever farmer is switched or data changed
  useEffect(() => {
    function handleSync() {
      setActiveProfile(farmerService.getFarmerProfile());
      setTick((t) => t + 1);
    }
    window.addEventListener("pf_farmer_changed", handleSync);
    window.addEventListener("pf_data_changed", handleSync);
    return () => {
      window.removeEventListener("pf_farmer_changed", handleSync);
      window.removeEventListener("pf_data_changed", handleSync);
    };
  }, []);

  // Determine active tab directly from URL pathname
  const activeTab: FarmerTab = (() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/farmer/plots")) return "plots";
    if (path.includes("/farmer/logs")) return "logs";
    if (path.includes("/farmer/requests")) return "requests";
    if (path.includes("/farmer/harvest")) return "harvest";
    if (path.includes("/farmer/profile")) return "profile";
    return "dashboard";
  })();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleTabChange(tab: FarmerTab) {
    if (tab === "dashboard") {
      navigate("/farmer");
    } else {
      navigate(`/farmer/${tab}`);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleQuickSwitchFarmer(id: "NV0001" | "NV0002" | "NV0003") {
    farmerService.switchActiveFarmer(id);
  }

  // Real-time badge counts from farmerService scoped to active farmer
  const plotsCount = farmerService.getPlots(activeProfile.id).length;
  const pendingRequestsCount = farmerService
    .getCareRequests(activeProfile.id)
    .filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length;
  const pendingHarvestCount = farmerService
    .getHarvests(activeProfile.id)
    .filter((h) => h.harvestStatus === "SCHEDULED").length;

  const menuItems: SidebarMenuItem<FarmerTab>[] = [
    { id: "dashboard", label: "Tổng quan Nông vụ", icon: "📊" },
    { id: "plots", label: "Quản lý Thửa đất", icon: "🌱", badge: `${plotsCount} thửa` },
    { id: "logs", label: "Nhật ký Canh tác", icon: "📝" },
    {
      id: "requests",
      label: "Yêu cầu Chăm sóc",
      icon: "💬",
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} mới` : undefined,
    },
    {
      id: "harvest",
      label: "Thu hoạch & Giao hàng",
      icon: "🌾",
      badge: pendingHarvestCount > 0 ? `${pendingHarvestCount} vụ` : undefined,
    },
    { id: "profile", label: "Hồ sơ Nông Dân", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Standardized Reusable Farmer Sidebar */}
      <Sidebar<FarmerTab>
        theme="emerald"
        brandTitle="PlotFarm"
        brandSubtitle="Cổng Nông Dân"
        brandShortName="PF"
        menuSectionTitle="Khu Vực Canh Tác"
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={setIsMobileSidebarOpen}
        user={{
          name: activeProfile.name || user?.fullName || "Nông Dân",
          emailOrStatus: `${activeProfile.assignedFarms[0] || "Trực đồng ruộng"}`,
          avatarText: activeProfile.avatarIcon || "👨‍🌾",
        }}
        extraFooterWidget={
          <div className="rounded-lg bg-emerald-950/60 p-2.5 flex items-center justify-between text-2xs text-emerald-200 border border-emerald-800/40">
            <span>Phụ trách:</span>
            <strong className="text-white">{plotsCount} thửa đất</strong>
          </div>
        }
        onLogout={handleLogout}
        logoutText="Đăng xuất"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">
              {activeProfile.assignedFarms.join(" • ") || "Hệ thống PlotFarm"}
            </p>
          </div>

          {/* Quick Demo Farmer Switcher in Header for effortless testing */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-emerald-50/90 border border-emerald-200 px-2 py-1 rounded-lg">
              <span className="text-2xs font-bold uppercase text-emerald-900 mr-1 flex items-center gap-1">
                <span>🧪</span>
                <span className="hidden md:inline">Test Nông Dân:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickSwitchFarmer("NV0001")}
                className={`px-2 py-0.5 rounded text-2xs font-semibold cursor-pointer transition ${
                  activeProfile.id === "NV0001"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-gray-700 hover:bg-emerald-100"
                }`}
                title="Lê Văn Canh Tác (Lâm Đồng & Bảo Lộc)"
              >
                👨‍🌾 Farmer 1
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitchFarmer("NV0002")}
                className={`px-2 py-0.5 rounded text-2xs font-semibold cursor-pointer transition ${
                  activeProfile.id === "NV0002"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-gray-700 hover:bg-emerald-100"
                }`}
                title="Nguyễn Thị Đồng Ruộng (Củ Chi)"
              >
                👩‍🌾 Farmer 2
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitchFarmer("NV0003")}
                className={`px-2 py-0.5 rounded text-2xs font-semibold cursor-pointer transition ${
                  activeProfile.id === "NV0003"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-gray-700 hover:bg-emerald-100"
                }`}
                title="Trần Văn Vườn (Mê Kông)"
              >
                🧑‍🌾 Farmer 3
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer text-xs"
              title="Xem Hồ sơ Nông Dân"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-gray-700 hidden sm:inline">
                {activeProfile.name}
              </span>
              <span className="text-xs text-emerald-700">⚙️</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <FarmerDashboard onNavigateTab={handleTabChange} />
          )}

          {activeTab === "plots" && <FarmerPlots />}

          {activeTab === "logs" && <FarmerLogs />}

          {activeTab === "requests" && <FarmerRequests />}

          {activeTab === "harvest" && <FarmerHarvest />}

          {activeTab === "profile" && <FarmerProfile />}
        </main>
      </div>
    </div>
  );
}
