import type { ReactNode } from "react";

export interface SidebarMenuItem<T extends string = string> {
  id: T;
  label: string;
  icon: ReactNode;
  badge?: string;
}

export interface SidebarProps<T extends string = string> {
  theme?: "slate" | "emerald";
  brandTitle: string;
  brandSubtitle: string;
  brandIcon?: ReactNode;
  brandShortName?: string;
  menuSectionTitle?: string;
  menuItems: SidebarMenuItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  isOpenMobile: boolean;
  onToggleMobile: (isOpen: boolean) => void;
  user?: {
    name?: string;
    emailOrStatus?: string;
    avatarText?: string;
  } | null;
  extraFooterWidget?: ReactNode;
  onLogout: () => void;
  logoutText?: string;
}

export default function Sidebar<T extends string = string>({
  theme = "slate",
  brandTitle,
  brandSubtitle,
  brandIcon,
  brandShortName = "PF",
  menuSectionTitle,
  menuItems,
  activeTab,
  onTabChange,
  isOpenMobile,
  onToggleMobile,
  user,
  extraFooterWidget,
  onLogout,
  logoutText = "Đăng xuất",
}: SidebarProps<T>) {
  const themeConfig = {
    slate: {
      mobileHeaderBg: "bg-slate-900",
      mobileLogoBg: "bg-indigo-600",
      mobileBtnHover: "hover:bg-slate-800",
      asideBg: "bg-slate-900 text-slate-100",
      borderSubtle: "border-slate-800",
      brandIconBg: "bg-linear-to-tr from-indigo-600 to-emerald-500",
      brandSubtitleText: "text-indigo-400",
      sectionTitleColor: "text-slate-400",
      activeItemBg: "bg-indigo-600 text-white shadow-sm font-semibold",
      inactiveItem: "text-slate-300 hover:bg-slate-800 hover:text-white",
      activeBadgeBg: "bg-indigo-800 text-indigo-100",
      inactiveBadgeBg: "bg-slate-800 text-slate-300",
      footerBg: "bg-slate-950/60",
      avatarBg: "bg-indigo-600 text-white",
      logoutBtn: "bg-slate-800 hover:bg-red-700 text-slate-200 hover:text-white",
    },
    emerald: {
      mobileHeaderBg: "bg-emerald-800",
      mobileLogoBg: "bg-emerald-600",
      mobileBtnHover: "hover:bg-emerald-700",
      asideBg: "bg-emerald-900 text-white",
      borderSubtle: "border-emerald-800/80",
      brandIconBg: "bg-emerald-600",
      brandSubtitleText: "text-emerald-300",
      sectionTitleColor: "text-emerald-400",
      activeItemBg: "bg-emerald-700 text-white shadow-sm font-semibold",
      inactiveItem: "text-emerald-100 hover:bg-emerald-800/60 hover:text-white",
      activeBadgeBg: "bg-emerald-900 text-emerald-200",
      inactiveBadgeBg: "bg-emerald-800 text-emerald-300",
      footerBg: "bg-emerald-950/40",
      avatarBg: "bg-emerald-600 text-white",
      logoutBtn: "bg-emerald-800/80 hover:bg-red-700 text-emerald-100 hover:text-white",
    },
  }[theme];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div
        className={`lg:hidden flex items-center justify-between text-white px-4 py-3 shadow-md ${themeConfig.mobileHeaderBg}`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${themeConfig.mobileLogoBg}`}
          >
            {brandShortName}
          </div>
          <span className="font-bold text-base">
            {brandTitle} {brandSubtitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleMobile(!isOpenMobile)}
          className={`p-1.5 rounded-md text-slate-200 transition cursor-pointer ${themeConfig.mobileBtnHover}`}
          aria-label="Mở menu điều hướng"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-2xs lg:hidden transition-opacity"
          onClick={() => onToggleMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Responsive Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-68 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          themeConfig.asideBg
        } ${isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="overflow-y-auto">
          {/* Brand Header */}
          <div
            className={`flex items-center justify-between px-6 py-5 border-b ${themeConfig.borderSubtle}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md ${themeConfig.brandIconBg}`}
              >
                {brandIcon || (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">
                  {brandTitle}
                </span>
                <span
                  className={`block text-2xs uppercase tracking-wider font-semibold ${themeConfig.brandSubtitleText}`}
                >
                  {brandSubtitle}
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => onToggleMobile(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Đóng menu"
            >
              ✕
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            {menuSectionTitle && (
              <div
                className={`px-3 py-2 text-2xs uppercase tracking-wider font-semibold ${themeConfig.sectionTitleColor}`}
              >
                {menuSectionTitle}
              </div>
            )}
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onToggleMobile(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive ? themeConfig.activeItemBg : themeConfig.inactiveItem
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-2xs px-2 py-0.5 rounded-full font-medium ${
                        isActive ? themeConfig.activeBadgeBg : themeConfig.inactiveBadgeBg
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Profile + Optional Extra Widget + Logout) */}
        <div
          className={`p-4 border-t space-y-3 shrink-0 ${themeConfig.borderSubtle} ${themeConfig.footerBg}`}
        >
          {extraFooterWidget}

          {user && (
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${themeConfig.avatarBg}`}
              >
                {user.avatarText || (user.name ? user.name.slice(0, 2) : "U")}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name || "Người dùng"}
                </p>
                <p className="text-2xs text-slate-400 truncate">
                  {user.emailOrStatus || ""}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-medium transition cursor-pointer ${themeConfig.logoutBtn}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{logoutText}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
