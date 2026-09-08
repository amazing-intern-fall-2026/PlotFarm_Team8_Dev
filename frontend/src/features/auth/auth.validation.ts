import type {
  LoginRequest,
  RegisterRequest,
} from "./auth.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(
  data: LoginRequest,
): string | null {
  if (!data.emailOrUsername || !data.emailOrUsername.trim()) {
    return "Vui lòng nhập Email hoặc Username";
  }

  if (!data.password) {
    return "Vui lòng nhập Mật khẩu";
  }

  return null;
}

export function validateRegister(
  data: RegisterRequest,
): string | null {
  if (!data.username || !data.username.trim()) {
    return "Vui lòng nhập Username";
  }

  if (data.username.trim().length < 3) {
    return "Username phải có ít nhất 3 ký tự";
  }

  if (!data.email || !data.email.trim()) {
    return "Vui lòng nhập Email";
  }

  if (!EMAIL_REGEX.test(data.email.trim())) {
    return "Email không hợp lệ (ví dụ: customer@plotfarm.com)";
  }

  if (!data.password) {
    return "Vui lòng nhập Mật khẩu";
  }

  if (data.password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (data.password !== data.confirmpassword) {
    return "Mật khẩu xác nhận không khớp";
  }

  return null;
}