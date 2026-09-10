import type { BackendError, LoginRequest, RegisterRequest } from "./auth.types";

export interface LoginFormErrors {
  username?: string;
  password?: string;
  [key: string]: string | undefined;
}

export interface RegisterFormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9,11}$/;
const NO_WHITESPACE_REGEX = /^[^\s]+$/;

/**
 * Validate Login Form (Frontend Validation)
 */
export function validateLoginForm(data: LoginRequest): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!data.username || !data.username.trim()) {
    errors.username = "Vui lòng nhập tên đăng nhập (Username)";
  }

  if (!data.password) {
    errors.password = "Vui lòng nhập mật khẩu";
  }

  return errors;
}

/**
 * Validate Register Form (Frontend Validation matching Backend rules)
 */
export function validateRegisterForm(data: RegisterRequest): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const fullName = data.fullName ? data.fullName.trim() : "";
  const email = data.email ? data.email.trim() : "";
  const phone = data.phone ? data.phone.trim() : "";
  const address = data.shippingAddress ? data.shippingAddress.trim() : "";
  const username = data.username ? data.username.trim() : "";
  const password = data.password || "";
  const confirmPassword = data.confirmPassword || "";

  // Full Name
  if (!fullName) {
    errors.fullName = "Họ và tên không được để trống";
  }

  // Email
  if (!email) {
    errors.email = "Email không được để trống";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Định dạng email không hợp lệ (ví dụ: user@example.com)";
  }

  // Phone (matches backend: 9-11 digits)
  if (!phone) {
    errors.phone = "Số điện thoại không được để trống";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Số điện thoại phải từ 9 đến 11 chữ số";
  }

  // Shipping Address
  if (!address) {
    errors.shippingAddress = "Địa chỉ nhận hàng/liên hệ không được để trống";
  }

  // Username (matches backend: 3-30 characters, no whitespace)
  if (!username) {
    errors.username = "Tên đăng nhập không được để trống";
  } else if (username.length < 3 || username.length > 30) {
    errors.username = "Tên đăng nhập phải từ 3 đến 30 ký tự";
  } else if (!NO_WHITESPACE_REGEX.test(username)) {
    errors.username = "Tên đăng nhập không được chứa dấu cách";
  }

  // Password (matches backend: min 8 characters)
  if (!password) {
    errors.password = "Mật khẩu không được để trống";
  } else if (password.length < 8) {
    errors.password = "Mật khẩu phải có tối thiểu 8 ký tự";
  }

  // Confirm Password
  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
  }

  return errors;
}

/**
 * Check if errors object has any validation error
 */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((err) => Boolean(err));
}

/**
 * Map express-validator errors array from Backend to field error object
 */
export function mapBackendValidationErrors(
  backendErrors: BackendError["errors"],
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!backendErrors) return result;

  if (Array.isArray(backendErrors)) {
    for (const item of backendErrors) {
      if (item.path && item.msg && !result[item.path]) {
        result[item.path] = item.msg;
      }
    }
  } else if (typeof backendErrors === "object") {
    for (const [key, val] of Object.entries(backendErrors)) {
      if (Array.isArray(val) && val.length > 0) {
        result[key] = val[0];
      } else if (typeof val === "string") {
        result[key] = val;
      }
    }
  }

  return result;
}

/**
 * Format human-friendly error message with HTTP status code and server detail
 */
export function formatBackendErrorMessage(error: BackendError): string {
  const statusPrefix = error.status ? `[Mã lỗi: ${error.status}] ` : "";
  let message = error.message;

  if (error.status === 401 || message === "Invalid credentials") {
    message = "Tên đăng nhập hoặc mật khẩu không chính xác (Invalid credentials)";
  } else if (error.status === 409 && message.toLowerCase().includes("username")) {
    message = "Tên đăng nhập đã có người sử dụng (Username already exists)";
  } else if (error.status === 409 && message.toLowerCase().includes("email")) {
    message = "Email này đã được đăng ký tài khoản khác (Email already exists)";
  } else if (error.status === 400 && message === "Validation failed") {
    message = "Dữ liệu không hợp lệ theo quy định backend. Vui lòng kiểm tra lại các trường.";
  }

  return `${statusPrefix}${message}`;
}