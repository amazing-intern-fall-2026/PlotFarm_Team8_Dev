import { useState, useRef, useEffect } from "react";

export interface UserDropdownMenuProps {
  user: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    roleBadge?: string;
    roleTitle?: string;
    avatarText?: string;
    avatarBg?: string;
  };
  theme?: "emerald" | "slate" | "indigo";
  onProfileClick: () => void;
  onChangePasswordClick?: () => void;
  onLogout: () => void;
  isActiveProfile?: boolean;
}

export default function UserDropdownMenu({
  user,
  theme = "emerald",
  onProfileClick,
  onChangePasswordClick,
  onLogout,
  isActiveProfile = false,
}: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayName = user.name || user.username || "Người dùng";
  const displayUsername = user.username ? `@${user.username}` : "";
  const roleBadge = user.roleBadge || user.roleTitle || "Thành Viên";
  const roleTitle = user.roleTitle || "Hồ sơ tài khoản";
  const avatarText = user.avatarText || (displayName.length > 2 ? displayName.slice(0, 2).toUpperCase() : displayName.slice(0, 1).toUpperCase());

  // Dynamic theme colors
  const avatarBg =
    user.avatarBg ||
    (theme === "slate"
      ? "bg-slate-900 text-white"
      : theme === "indigo"
      ? "bg-indigo-600 text-white"
      : "bg-linear-to-tr from-emerald-600 to-teal-400 text-white");

  const badgeThemeClasses =
    theme === "slate"
      ? "bg-slate-100 text-slate-800 border-slate-200"
      : theme === "indigo"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left shadow-2xs group select-none ${
          isOpen
            ? "border-gray-400 bg-gray-50 ring-2 ring-emerald-500/20"
            : isActiveProfile
            ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Tùy chọn tài khoản & Hồ sơ"
      >
        {/* Avatar Circle */}
        <div
          className={`h-8 w-8 rounded-full ${avatarBg} flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0`}
        >
          {avatarText}
        </div>

        {/* User Info Label */}
        <div className="hidden sm:block text-left leading-tight pr-0.5">
          <span className="text-xs font-bold text-gray-900 group-hover:text-gray-950 block max-w-[130px] truncate">
            {displayName}
          </span>
          <span className="text-2xs text-gray-400 block font-medium truncate">
            {roleTitle}
          </span>
        </div>

        {/* Chevron Caret Indicator */}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-gray-700" : "group-hover:text-gray-600"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Floating Dropdown Box Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black/5 border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Header Section */}
          <div className="px-3 py-3 rounded-xl bg-slate-50/80 border border-slate-100/80 mb-1.5 flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-full ${avatarBg} flex items-center justify-center font-bold text-sm uppercase shadow-xs shrink-0`}
            >
              {avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                {displayName}
              </p>
              {displayUsername && (
                <p className="text-2xs text-gray-500 font-mono truncate">
                  {displayUsername}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeThemeClasses}`}
                >
                  {roleBadge}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Action Options */}
          <div className="space-y-0.5">
            {/* View / Edit Profile */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onProfileClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition cursor-pointer group"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-emerald-900">
                  Hồ sơ cá nhân
                </p>
                <p className="text-[10px] text-gray-400">
                  Xem & chỉnh sửa thông tin tài khoản
                </p>
              </div>
            </button>

            {/* Change Password Option */}
            {onChangePasswordClick && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onChangePasswordClick();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 transition cursor-pointer group"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-indigo-900">
                    Đổi mật khẩu
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Cập nhật mật khẩu bảo mật
                  </p>
                </div>
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Logout Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer group"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-600 transition">
                <svg
                  className="w-4 h-4"
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
              </span>
              <div>
                <p className="font-semibold text-red-600">Đăng xuất</p>
                <p className="text-[10px] text-red-400">
                  Thoát khỏi phiên làm việc
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
