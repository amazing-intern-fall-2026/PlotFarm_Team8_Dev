import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { getCurrentUser, getRedirectPathByRole, isAuthenticated, logout } from "./auth.api";
import { Alert } from "../../components/ui";
import { useAuth } from "./AuthContext";

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout: logoutAuthContext } = useAuth();
  const currentUser = authUser || (isAuthenticated() ? getCurrentUser() : null);

  // Purely derived mode from URL or props without setState in effect
  const isRegisterRoute = location.pathname.includes("register");
  const mode: "login" | "register" =
    initialMode || (isRegisterRoute ? "register" : "login");

  function handleSwitchMode(newMode: "login" | "register") {
    navigate(newMode === "register" ? "/register" : "/login");
  }

  function handleLogoutCurrent() {
    logoutAuthContext();
    logout();
  }

  function handleGoToRolePage() {
    if (!currentUser) return;
    navigate(getRedirectPathByRole(currentUser.role));
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50/40 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* PlotFarm Brand Logo & Badge */}
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-3">
          <svg
            className="h-8 w-8"
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

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          PlotFarm <span className="text-emerald-600">Portal</span>
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Hệ thống quản lý nông nghiệp số hóa dành cho Khách hàng, Nông dân và Quản trị viên
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-8">
          {/* Active Session Notice if already logged in */}
          {currentUser && (
            <Alert
              variant="success"
              className="mb-5"
              icon={
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              }
              title="Đang duy trì phiên đăng nhập:"
            >
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {currentUser.fullName || currentUser.username} (
                    <strong className="uppercase">{currentUser.role}</strong>)
                  </span>
                  <button
                    type="button"
                    onClick={handleLogoutCurrent}
                    className="font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              {/* Dùng button gọi hàm handleGoToRolePage thay cho Link */}
                <button
                  type="button"
                  onClick={handleGoToRolePage}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white font-medium hover:bg-emerald-700 transition text-center text-xs cursor-pointer w-full"
                >
                  Vào trang {currentUser.role} →
                </button>
              </div>
            </Alert>
          )}

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-gray-100/90 p-1 mb-6">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                mode === "login"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                mode === "register"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Đăng ký mới
            </button>
          </div>

          {/* Form Content */}
          {mode === "login" ? (
            <LoginForm
              onSwitchToRegister={() => handleSwitchMode("register")}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => handleSwitchMode("login")}
              onSuccessRedirect="/customer"
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>© 2026 PlotFarm. Nền tảng số hóa nông nghiệp & quản lý thửa đất.</p>
          <div className="flex justify-center gap-4 text-gray-400">
            <a href="#help" className="hover:text-emerald-600 transition">Trung tâm hỗ trợ</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-emerald-600 transition">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#terms" className="hover:text-emerald-600 transition">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </div>
  );
}
