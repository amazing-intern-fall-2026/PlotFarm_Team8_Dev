import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getRedirectPathByRole, login } from "../auth/auth.api";
import type { BackendError, LoginRequest } from "../auth/auth.types";
import { validateLogin } from "../auth/auth.validation";
import Button from "../common/Button";
import Input from "../common/Input";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccessRedirect?: string;
}

export default function LoginForm({
  onSwitchToRegister,
  onSuccessRedirect,
}: LoginFormProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginRequest>({
    emailOrUsername: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof LoginRequest, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // Quick fill helper for testing multi-roles
  function handleFillDemo(type: "admin" | "farmer" | "customer" | "wrong_pass" | "blocked") {
    if (type === "admin") {
      setForm({
        emailOrUsername: "admin@plotfarm.com",
        password: "password123",
      });
    } else if (type === "farmer") {
      setForm({
        emailOrUsername: "farmer@plotfarm.com",
        password: "password123",
      });
    } else if (type === "customer") {
      setForm({
        emailOrUsername: "customer@plotfarm.com",
        password: "password123",
      });
    } else if (type === "wrong_pass") {
      setForm({
        emailOrUsername: "customer@plotfarm.com",
        password: "wrongpass",
      });
    } else {
      setForm({
        emailOrUsername: "blocked@plotfarm.com",
        password: "password123",
      });
    }
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side validation
    const validationError = validateLogin(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Call login API
      const response = await login(form);

      // Automatically redirect based on user role if no specific redirect is specified
      const redirectPath =
        onSuccessRedirect || getRedirectPathByRole(response.user.role);

      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      if (backendErr?.message) {
        setError(backendErr.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối mạng.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Direct 1-Click login without manual typing
  async function handleDirectLogin(role: "admin" | "farmer" | "customer") {
    try {
      setLoading(true);
      setError("");
      const credentials = {
        admin: { emailOrUsername: "admin@plotfarm.com", password: "password123" },
        farmer: { emailOrUsername: "farmer@plotfarm.com", password: "password123" },
        customer: { emailOrUsername: "customer@plotfarm.com", password: "password123" },
      }[role];

      setForm(credentials);
      const response = await login(credentials);
      const targetPath =
        onSuccessRedirect || getRedirectPathByRole(response.user.role);
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      setError(backendErr?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Backend / Validation Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 animate-in fade-in duration-200"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <span className="font-semibold">Lỗi: </span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
              aria-label="Đóng thông báo"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        <Input
          label="Email hoặc Username"
          type="text"
          placeholder="username@plotfarm.com hoặc username"
          value={form.emailOrUsername}
          disabled={loading}
          autoComplete="username"
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
          onChange={(event) =>
            handleChange("emailOrUsername", event.target.value)
          }
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={form.password}
          disabled={loading}
          autoComplete="current-password"
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
              alert("Tính năng quên mật khẩu đang được kết nối với hệ thống SMS/Email OTP.");
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

      {/* Multi-role demo testing helper tools */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-gray-600 space-y-2.5">
        <div className="font-semibold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 01-1 1H7a1 1 0 000 2h1a1 1 0 011 1v1a1 1 0 102 0v-1a1 1 0 011-1h1a1 1 0 100-2h-1a1 1 0 01-1-1V3z" />
            </svg>
            Đăng nhập nhanh theo quyền (1-Click Vào Trang):
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDirectLogin("admin")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <span className="text-base">👑</span>
            <span className="font-bold text-xs mt-0.5">Vào Admin</span>
            <span className="text-2xs text-indigo-200">/admin</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDirectLogin("farmer")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <span className="text-base">🚜</span>
            <span className="font-bold text-xs mt-0.5">Vào Farmer</span>
            <span className="text-2xs text-emerald-200">/farmer</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDirectLogin("customer")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <span className="text-base">👤</span>
            <span className="font-bold text-xs mt-0.5">Vào Customer</span>
            <span className="text-2xs text-teal-200">/customer</span>
          </button>
        </div>

        <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-2xs text-gray-500">
          <span>Điền form để tự bấm:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("admin")}
              className="text-indigo-600 hover:underline font-medium"
            >
              Điền Admin
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("farmer")}
              className="text-emerald-600 hover:underline font-medium"
            >
              Điền Farmer
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleFillDemo("wrong_pass")}
              className="text-amber-600 hover:underline font-medium"
            >
              Test lỗi 401
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}


