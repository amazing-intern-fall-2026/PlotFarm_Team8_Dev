import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getRedirectPathByRole, login, loginWithDemoRole } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import type { BackendError, LoginRequest } from "../auth/auth.types";
import {
  formatBackendErrorMessage,
  hasErrors,
  mapBackendValidationErrors,
  validateLoginForm,
  type LoginFormErrors,
} from "../auth/auth.validation";
import { Button, Input, Alert } from "../../components/ui";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccessRedirect?: string;
}

export default function LoginForm({
  onSwitchToRegister,
  onSuccessRedirect,
}: LoginFormProps) {
  const navigate = useNavigate();
  const { login: setAuthContext } = useAuth();

  const [form, setForm] = useState<LoginRequest>({
    username: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [generalError, setGeneralError] = useState<{
    status?: number;
    message: string;
    details?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof LoginRequest, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-level error when user starts correcting it
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (generalError) {
      setGeneralError(null);
    }
  }

  // 1-Click login using Mock Demo Account
  function handleQuickDemoLogin(role: "farmer" | "farmer1" | "farmer2" | "farmer3" | "admin" | "customer") {
    try {
      setLoading(true);
      const auth = loginWithDemoRole(role);
      setAuthContext(auth.accessToken, auth.user);
      const targetPath = onSuccessRedirect || getRedirectPathByRole(auth.user?.role);
      navigate(targetPath, { replace: true });
    } finally {
      setLoading(false);
    }
  }

  // Quick fill input fields
  function handleFillDemo(username: string) {
    setForm({
      username,
      password: "password123",
    });
    setFieldErrors({});
    setGeneralError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Frontend validation
    const clientValidationErrors = validateLoginForm(form);
    if (hasErrors(clientValidationErrors)) {
      setFieldErrors(clientValidationErrors);
      return;
    }

    try {
      setLoading(true);
      setFieldErrors({});
      setGeneralError(null);

      // Call real backend API (falls back to mock if backend 401/offline and demo username is used)
      const response = await login(form);
      setAuthContext(response.accessToken, response.user);

      // Redirect based on user role returned from backend
      const targetPath =
        onSuccessRedirect || getRedirectPathByRole(response.user?.role);
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      const status = backendErr?.status;
      const formattedMessage = backendErr
        ? formatBackendErrorMessage(backendErr)
        : "Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối mạng.";

      // Map backend field-level validation errors (if any)
      const mappedFieldErrors = mapBackendValidationErrors(backendErr?.errors);
      if (Object.keys(mappedFieldErrors).length > 0) {
        setFieldErrors(mappedFieldErrors);
      }

      // Collect validation detail bullet points if present
      let details: string[] | undefined;
      if (Array.isArray(backendErr?.errors)) {
        details = backendErr.errors.map((e) => `${e.path ? `${e.path}: ` : ""}${e.msg}`);
      }

      setGeneralError({
        status,
        message: formattedMessage,
        details,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Backend & Validation Error Alert */}
        {generalError && (
          <Alert
            variant="error"
            title={
              generalError.status ? (
                <span className="flex items-center gap-2">
                  <span className="rounded bg-red-200/70 px-1.5 py-0.5 text-2xs font-mono font-bold text-red-900">
                    HTTP {generalError.status}
                  </span>
                  <span>Thông báo từ hệ thống:</span>
                </span>
              ) : (
                "Lỗi đăng nhập:"
              )
            }
            onClose={() => setGeneralError(null)}
          >
            <div className="space-y-1">
              <p>{generalError.message}</p>
              {generalError.details && generalError.details.length > 0 && (
                <ul className="mt-1 list-disc list-inside text-xs text-red-800 space-y-0.5">
                  {generalError.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </Alert>
        )}

        <Input
          label="Tên tài khoản (Username)"
          type="text"
          placeholder="Ví dụ: farmer, admin, hoặc tài khoản đã đăng ký"
          value={form.username}
          disabled={loading}
          autoComplete="username"
          error={fieldErrors.username}
          leftIcon={
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          onChange={(event) => handleChange("username", event.target.value)}
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={form.password}
          disabled={loading}
          autoComplete="current-password"
          error={fieldErrors.password}
          leftIcon={
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
          onChange={(event) => handleChange("password", event.target.value)}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              defaultChecked
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert("Tính năng quên mật khẩu đang kết nối với hệ thống xác thực. Vui lòng liên hệ Quản trị viên.");
            }}
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button type="submit" loading={loading} variant="primary">
          Đăng nhập vào Hệ Thống
        </Button>
      </form>

      {/* Switch to Register link */}
      {onSwitchToRegister && (
        <div className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      )}

      {/* Demo Mock Testing Tool (1-Click Vào Thẳng Trang theo Role) */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs space-y-3">
        <div className="font-semibold text-emerald-950 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🚀</span>
            Tài khoản kiểm thử nhanh (Demo 1-Click):
          </span>
          <span className="text-2xs text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium">
            3 Nông Dân + Admin + Customer
          </span>
        </div>

        {/* Farmer Mock Buttons (Demonstrating Admin Assignment Rule) */}
        <div>
          <div className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>👨‍🌾</span>
            <span>Nông Dân (Phân công Farm/Plot khác nhau):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin("farmer1")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
            >
              <span className="text-base">👨‍🌾</span>
              <span className="font-bold text-xs mt-0.5">Farmer 1</span>
              <span className="text-2xs text-emerald-100">Lâm Đồng & Bảo Lộc (5 plots)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin("farmer2")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
            >
              <span className="text-base">👩‍🌾</span>
              <span className="font-bold text-xs mt-0.5">Farmer 2</span>
              <span className="text-2xs text-emerald-100">Củ Chi Hữu Cơ (3 plots)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin("farmer3")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
            >
              <span className="text-base">🧑‍🌾</span>
              <span className="font-bold text-xs mt-0.5">Farmer 3</span>
              <span className="text-2xs text-teal-100">Mê Kông Cây Ăn Trái (2 plots)</span>
            </button>
          </div>
        </div>

        {/* Other Roles */}
        <div>
          <div className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>👥</span>
            <span>Các vai trò khác:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin("admin")}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span className="text-base">👑</span>
              <div className="text-left">
                <span className="font-bold text-xs block">Vào Admin</span>
                <span className="text-2xs text-indigo-200">/admin (ADMIN)</span>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin("customer")}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span className="text-base">👤</span>
              <div className="text-left">
                <span className="font-bold text-xs block">Vào Khách Hàng</span>
                <span className="text-2xs text-blue-200">/customer (CUSTOMER)</span>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-2xs text-gray-500">
          <span>Điền nhanh:</span>
          <div className="flex gap-2 font-medium flex-wrap">
            <button
              type="button"
              onClick={() => handleFillDemo("farmer1")}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              farmer1
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("farmer2")}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              farmer2
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("farmer3")}
              className="text-teal-700 hover:underline cursor-pointer"
            >
              farmer3
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("admin")}
              className="text-indigo-700 hover:underline cursor-pointer"
            >
              admin
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("customer")}
              className="text-blue-700 hover:underline cursor-pointer"
            >
              customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
