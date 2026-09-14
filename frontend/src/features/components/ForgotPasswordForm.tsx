import { useState, type FormEvent } from "react";
import { forgotPassword, resetPassword } from "../auth/auth.api";
import type { BackendError } from "../auth/auth.types";
import { Button, Input, Alert } from "../../components/ui";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({
  onSwitchToLogin,
  onSuccess,
}: ForgotPasswordFormProps) {
  // Step 1: Request OTP | Step 2: Enter OTP & Reset Password | Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Metadata from step 1
  const [maskedEmail, setMaskedEmail] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  // Error & loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Handle Step 1: Send OTP
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!identifier.trim()) {
      setFieldErrors({ identifier: "Vui lòng nhập tên đăng nhập hoặc email" });
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ identifier: identifier.trim() });
      setMaskedEmail(res.data?.emailMasked || "");
      if (res.data?.devOtp) {
        setDevOtpCode(res.data.devOtp);
      }
      setSuccessMsg(`Mã xác thực OTP đã được gửi đến: ${res.data?.emailMasked || "email của bạn"}`);
      setStep(2);
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      setErrorMsg(
        backendErr?.message || "Không thể gửi mã xác nhận. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 2: Reset Password
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!otp.trim()) {
      errors.otp = "Vui lòng nhập mã OTP 6 số";
    } else if (!/^\d{6}$/.test(otp.trim())) {
      errors.otp = "Mã OTP phải bao gồm đúng 6 chữ số";
    }

    if (!newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccessMsg(res.message || "Đặt lại mật khẩu thành công!");
      setStep(3);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      setErrorMsg(
        backendErr?.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await forgotPassword({ identifier: identifier.trim() });
      if (res.data?.devOtp) {
        setDevOtpCode(res.data.devOtp);
      }
      setSuccessMsg("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.");
    } catch (err: unknown) {
      const backendErr = err as BackendError;
      setErrorMsg(backendErr?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">
          {step === 1 && "Quên mật khẩu?"}
          {step === 2 && "Xác thực OTP & Mật khẩu mới"}
          {step === 3 && "Khôi phục thành công"}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {step === 1 && "Nhập email hoặc tên tài khoản của bạn để nhận mã xác thực"}
          {step === 2 && `Mã xác nhận đã được gửi đến: ${maskedEmail || "email của bạn"}`}
          {step === 3 && "Mật khẩu của bạn đã được cập nhật thành công"}
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <Alert variant="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && step !== 3 && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Step 1 Form */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <Input
            label="Email hoặc Tên tài khoản"
            type="text"
            placeholder="Nhập email hoặc tên đăng nhập"
            value={identifier}
            disabled={loading}
            error={fieldErrors.identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (fieldErrors.identifier) setFieldErrors({});
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Button type="submit" loading={loading} variant="primary" className="w-full">
            Gửi mã xác nhận
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        </form>
      )}

      {/* Step 2 Form */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {/* Dev/Demo Hint Tool */}
          {devOtpCode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-center justify-between">
              <div>
                <span className="font-semibold">Mã OTP thử nghiệm (Dev/Demo): </span>
                <span className="font-mono font-bold text-amber-950 text-sm tracking-wider">
                  {devOtpCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtpCode)}
                className="rounded bg-amber-200 px-2 py-1 text-2xs font-semibold text-amber-900 hover:bg-amber-300 transition cursor-pointer"
              >
                Tự động điền
              </button>
            </div>
          )}

          <Input
            label="Mã xác thực OTP (6 số)"
            type="text"
            maxLength={6}
            placeholder="Nhập 6 số được gửi về email"
            value={otp}
            disabled={loading}
            error={fieldErrors.otp}
            onChange={(e) => {
              setOtp(e.target.value);
              if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: "" }));
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          />

          <Input
            label="Mật khẩu mới (tối thiểu 8 ký tự)"
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            disabled={loading}
            error={fieldErrors.newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            disabled={loading}
            error={fieldErrors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
          />

          <Button type="submit" loading={loading} variant="primary" className="w-full">
            Đặt lại mật khẩu
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleResendOtp}
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
            >
              Gửi lại mã OTP
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
            >
              Đổi email/tài khoản
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Success State */}
      {step === 3 && (
        <div className="text-center space-y-4 py-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="text-sm text-gray-600">
            Mật khẩu mới của bạn đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.
          </p>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={onSwitchToLogin}
          >
            Đăng nhập ngay
          </Button>
        </div>
      )}
    </div>
  );
}
