import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Sidebar, UserDropdownMenu, type SidebarMenuItem } from "../../components/layout";
import ChangePasswordModal from "../auth/ChangePasswordModal";
import FarmerNotificationBell from "./FarmerNotificationBell";
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
  const { user: authUser, logout: authLogout } = useAuth();
  const user = authUser || getCurrentUser();

  const [activeProfile, setActiveProfile] = useState<FarmerProfileData>(() =>
    farmerService.getFarmerProfile(),
  );
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [, setTick] = useState(0);

  // Sync state whenever farmer is switched or data changed
  useEffect(() => {
    farmerService.fetchFarmerDataAsync();

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
    authLogout();
    navigate("/", { replace: true });
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
          name: user?.fullName || activeProfile.name || "Nông Dân",
          emailOrStatus: user?.email || `${activeProfile.assignedFarms[0] || "Trực đồng ruộng"}`,
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
        onUserProfileClick={() => handleTabChange("profile")}
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

          <div className="flex items-center gap-3">
            {/* Real-time Notification Bell for Farmer */}
            <FarmerNotificationBell
              onNavigate={(tab) => handleTabChange(tab)}
            />

            {/* Polished User Dropdown Menu */}
            <UserDropdownMenu
              user={{
                name: user?.fullName || activeProfile.name || "Kỹ Sư Nông Dân",
                username: user?.username,
                email: user?.email,
                phone: (user as any)?.phone || activeProfile.phone,
                roleBadge: "Kỹ Sư Canh Tác",
                roleTitle: "Kỹ Sư Nông Nghiệp",
                avatarText: activeProfile.avatarIcon || "👨‍🌾",
                avatarBg: "bg-emerald-700 text-white",
              }}
              theme="emerald"
              isActiveProfile={activeTab === "profile"}
              onProfileClick={() => handleTabChange("profile")}
              onChangePasswordClick={() => setIsChangePasswordOpen(true)}
              onLogout={handleLogout}
            />
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

      {/* Change Password Modal accessible directly from header */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmailOrName={user?.fullName || activeProfile.name}
      />
    </div>
  );
}
