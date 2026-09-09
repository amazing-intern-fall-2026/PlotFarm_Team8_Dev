import type { ReactNode } from "react";

export interface NavbarProps {
  brandTitle?: string;
  brandHighlight?: string;
  portalBadge?: string;
  brandIcon?: ReactNode;
  user?: {
    name?: string;
    email?: string;
    avatarText?: string;
  } | null;
  actions?: ReactNode;
  onLogout?: () => void;
  logoutText?: string;
  className?: string;
}

export default function Navbar({
  brandTitle = "Plot",
  brandHighlight = "Farm",
  portalBadge = "Customer Portal",
  brandIcon,
  user,
  actions,
  onLogout,
  logoutText = "Đăng xuất",
  className = "",
}: NavbarProps) {
  return (
    <header
      className={`sticky top-0 z-30 border-b border-gray-200 bg-white shadow-xs ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            {brandIcon || (
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
            )}
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              {brandTitle}
              <span className="text-emerald-600">{brandHighlight}</span>
            </span>
            {portalBadge && (
              <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                {portalBadge}
              </span>
            )}
          </div>
        </div>

        {/* Center Actions Slot */}
        {actions && <div className="hidden md:flex items-center gap-4">{actions}</div>}

        {/* User Profile & Logout Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 text-right">
              <div className="h-9 w-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                {user.avatarText || (user.name ? user.name.charAt(0) : "U")}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user.name || "Khách hàng"}
                </p>
                {user.email && (
                  <p className="text-xs text-gray-500">{user.email}</p>
                )}
              </div>
            </div>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
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
              <span>{logoutText}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
