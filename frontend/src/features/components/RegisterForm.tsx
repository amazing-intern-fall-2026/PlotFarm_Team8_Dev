import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getRedirectPathByRole, login, register } from "../auth/auth.api";
import type { BackendError, RegisterRequest } from "../auth/auth.types";
import {
  formatBackendErrorMessage,
  hasErrors,
  mapBackendValidationErrors,
  validateRegisterForm,
  type RegisterFormErrors,
} from "../auth/auth.validation";
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
    fullName: "",
    email: "",
    phone: "",
    shippingAddress: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
  const [generalError, setGeneralError] = useState<{
    status?: number;
    message: string;
    details?: string[];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof RegisterRequest, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user modifies the field
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Frontend validation
    const clientValidationErrors = validateRegisterForm(form);
    if (hasErrors(clientValidationErrors)) {
      setFieldErrors(clientValidationErrors);
      return;
    }

    try {
      setLoading(true);
      setFieldErrors({});
      setGeneralError(null);
      setSuccessMessage("");

      // 1. Call real backend register API
      const registerRes = await register(form);

      setSuccessMessage(
        registerRes.message || "Đăng ký tài khoản thành công! Đang tự động đăng nhập...",
      );

      // 2. Automatically log in with new credentials
      try {
        const loginRes = await login({
          username: form.username.trim(),
          password: form.password,
        });

        const targetPath =
          onSuccessRedirect || getRedirectPathByRole(loginRes.user?.role);

        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 1200);
      } catch {
        // In case automatic login fails, prompt user to switch to Login tab
        setSuccessMessage("Đăng ký thành công! Vui lòng đăng nhập với tài khoản vừa tạo.");
        setTimeout(() => {
          if (onSwitchToLogin) {
            onSwitchToLogin();
          } else {
            navigate("/login");
          }
        }, 1500);
      }
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      const status = backendErr?.status;
      const formattedMessage = backendErr
        ? formatBackendErrorMessage(backendErr)
        : "Đăng ký thất bại. Vui lòng kiểm tra lại kết nối backend.";

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
                "Lỗi đăng ký:"
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

        {/* Success Alert */}
        {successMessage && (
          <Alert variant="success" title="Đăng ký thành công">
            {successMessage}
          </Alert>
        )}

        {/* Họ và tên */}
        <Input
          label="Họ và tên"
          type="text"
          placeholder="Ví dụ: Nguyễn Văn Nông"
          value={form.fullName}
          disabled={loading}
          autoComplete="name"
          error={fieldErrors.fullName}
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
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          onChange={(event) => handleChange("fullName", event.target.value)}
        />

        {/* Tên đăng nhập */}
        <Input
          label="Tên tài khoản (Username)"
          type="text"
          placeholder="Tối thiểu 3 ký tự, không chứa khoảng trắng"
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

        {/* Email */}
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="example@plotfarm.com"
          value={form.email}
          disabled={loading}
          autoComplete="email"
          error={fieldErrors.email}
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

        {/* Số điện thoại */}
        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="Số điện thoại từ 9-11 chữ số"
          value={form.phone}
          disabled={loading}
          autoComplete="tel"
          error={fieldErrors.phone}
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          }
          onChange={(event) => handleChange("phone", event.target.value)}
        />

        {/* Địa chỉ giao hàng / liên hệ */}
        <Input
          label="Địa chỉ liên hệ / giao hàng"
          type="text"
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP"
          value={form.shippingAddress}
          disabled={loading}
          autoComplete="street-address"
          error={fieldErrors.shippingAddress}
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          onChange={(event) => handleChange("shippingAddress", event.target.value)}
        />

        {/* Mật khẩu */}
        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 8 ký tự theo quy định hệ thống"
          value={form.password}
          disabled={loading}
          autoComplete="new-password"
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

        {/* Xác nhận mật khẩu */}
        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu để kiểm tra"
          value={form.confirmPassword}
          disabled={loading}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
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
            handleChange("confirmPassword", event.target.value)
          }
        />

        <div className="pt-2">
          <Button type="submit" loading={loading} variant="primary">
            Tạo tài khoản Khách hàng
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
    </div>
  );
}
