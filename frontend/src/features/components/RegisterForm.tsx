import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../auth/auth.api";
import type { BackendError, RegisterRequest } from "../auth/auth.types";
import { validateRegister } from "../auth/auth.validation";
import { Button, Input, Alert } from "../../components/ui";

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccessRedirect?: string;
}

export default function RegisterForm({
  onSwitchToLogin,
  onSuccessRedirect = "/customer",
}: RegisterFormProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof RegisterRequest, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // Quick fill helper for testing registration
  function handleFillDemo(type: "valid" | "duplicate_email" | "duplicate_user") {
    if (type === "valid") {
      const randomId = Math.floor(Math.random() * 1000);
      setForm({
        username: `nongdan_${randomId}`,
        email: `nongdan${randomId}@plotfarm.com`,
        password: "password123",
        confirmpassword: "password123",
      });
    } else if (type === "duplicate_email") {
      setForm({
        username: "user_test",
        email: "customer@plotfarm.com", // Existing email
        password: "password123",
        confirmpassword: "password123",
      });
    } else {
      setForm({
        username: "admin", // Existing username
        email: "admin_unique@plotfarm.com",
        password: "password123",
        confirmpassword: "password123",
      });
    }
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side validation
    const validationError = validateRegister(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      // Call register API
      await register(form);

      setSuccessMessage("Đăng ký thành công! Đang chuyển hướng vào trang chính...");

      setTimeout(() => {
        navigate(onSuccessRedirect);
      }, 1000);
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      if (backendErr?.message) {
        setError(backendErr.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng kiểm tra lại kết nối backend.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Backend / Validation Error Alert */}
        {error && (
          <Alert
            variant="error"
            title="Lỗi đăng ký:"
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert variant="success">
            {successMessage}
          </Alert>
        )}

        <Input
          label="Tên tài khoản (Username)"
          type="text"
          placeholder="Ví dụ: nongdanviet"
          value={form.username}
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
          onChange={(event) => handleChange("username", event.target.value)}
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="customer@plotfarm.com"
          value={form.email}
          disabled={loading}
          autoComplete="email"
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          onChange={(event) => handleChange("email", event.target.value)}
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={form.password}
          disabled={loading}
          autoComplete="new-password"
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

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={form.confirmpassword}
          disabled={loading}
          autoComplete="new-password"
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
          onChange={(event) =>
            handleChange("confirmpassword", event.target.value)
          }
        />

        <div className="pt-1">
          <Button type="submit" loading={loading} variant="primary">
            Tạo tài khoản Customer
          </Button>
        </div>
      </form>

      {/* Switch to Login link */}
      {onSwitchToLogin && (
        <div className="text-center text-sm text-gray-600">
          Đã có tài khoản PlotFarm?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Demo testing helper tools */}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-gray-600">
        <div className="mb-2 font-medium text-emerald-800 flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 01-1 1H7a1 1 0 000 2h1a1 1 0 011 1v1a1 1 0 102 0v-1a1 1 0 011-1h1a1 1 0 100-2h-1a1 1 0 01-1-1V3z" />
          </svg>
          Mẹo kiểm thử đăng ký (Demo):
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo("valid")}
            className="rounded bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-xs border border-emerald-200 hover:bg-emerald-100 transition"
          >
            Điền tài khoản mới
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo("duplicate_email")}
            className="rounded bg-white px-2.5 py-1 text-xs font-medium text-amber-700 shadow-xs border border-amber-200 hover:bg-amber-100 transition"
          >
            Test trùng Email (400)
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo("duplicate_user")}
            className="rounded bg-white px-2.5 py-1 text-xs font-medium text-red-700 shadow-xs border border-red-200 hover:bg-red-100 transition"
          >
            Test trùng Username (400)
          </button>
        </div>
      </div>
    </div>
  );
}
