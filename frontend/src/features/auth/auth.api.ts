import type {
  ApiResponse,
  AuthResponse,
  BackendError,
  ForgotPasswordRequest,
  ForgotPasswordResponseData,
  LoginRequest,
  RegisterRequest,
  RegisterResponseData,
  ResetPasswordRequest,
  User,
} from "./auth.types";

const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

const STORAGE_KEYS = {
  TOKEN: "accessToken",
  USER: "authUser",
  REMEMBER: "rememberMe",
};

// Predefined accounts matching seeded database
export type DemoRoleKey = "farmer" | "farmer1" | "farmer2" | "farmer3" | "admin" | "customer" | "customer2";

export const TEST_ACCOUNTS: Record<string, { username: string; password: string; role: string; name: string }> = {
  admin: { username: "admin", password: "admin123", role: "ADMIN", name: "Trần Quản Trị (Admin Toàn Quyền)" },
  farmer: { username: "farmer", password: "farmer123", role: "FARMER", name: "Lê Văn Canh Tác (Nông Dân 1)" },
  farmer1: { username: "farmer1", password: "farmer123", role: "FARMER", name: "Lê Văn Canh Tác (Nông Dân 1)" },
  farmer2: { username: "farmer2", password: "farmer123", role: "FARMER", name: "Nguyễn Thị Đồng Ruộng (Nông Dân 2)" },
  farmer3: { username: "farmer3", password: "farmer123", role: "FARMER", name: "Trần Văn Vườn (Nông Dân 3)" },
  customer: { username: "customer", password: "customer123", role: "CUSTOMER", name: "Nguyễn Văn Nông (Có hợp đồng)" },
  customer2: { username: "customer2", password: "customer123", role: "CUSTOMER", name: "Trần Thị Mai (Mới, sẵn sàng thuê)" },
};

export const DEMO_ACCOUNTS = TEST_ACCOUNTS;

// ─────────────────────────────────────────────────────────────
// Storage helpers: sessionStorage (không nhớ) vs localStorage (nhớ)
// ─────────────────────────────────────────────────────────────

/**
 * Trả về storage đang lưu token.
 * Ưu tiên sessionStorage trước (phiên hiện tại không ghi nhớ),
 * rồi mới kiểm tra localStorage (phiên ghi nhớ lâu dài).
 */
function getActiveStorage(): Storage {
  if (typeof window === "undefined") return localStorage;
  if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) return sessionStorage;
  return localStorage;
}

/**
 * Chọn storage dựa trên lựa chọn "Ghi nhớ đăng nhập":
 * - true  → localStorage  (còn sau khi đóng trình duyệt)
 * - false → sessionStorage (mất khi đóng tab/trình duyệt)
 */
function pickStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

// ─────────────────────────────────────────────────────────────
// JWT expiry helpers
// ─────────────────────────────────────────────────────────────

/**
 * Giải mã phần payload của JWT và kiểm tra trường `exp`.
 * Trả về true nếu token đã hết hạn.
 */
function isTokenExpired(token: string): boolean {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return true;
    const padded = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// Network helpers
// ─────────────────────────────────────────────────────────────

/**
 * Extract structured BackendError from fetch Response or catch block
 */
async function parseErrorResponse(response: Response): Promise<BackendError> {
  try {
    const errorBody = await response.json();
    return {
      message: errorBody.message || `Lỗi yêu cầu (${response.status})`,
      status: response.status,
      errors: errorBody.errors || null,
      code: errorBody.code,
    };
  } catch {
    return {
      message: `Máy chủ phản hồi mã lỗi HTTP ${response.status}: ${response.statusText || "Không rõ nguyên nhân"}`,
      status: response.status,
      errors: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Auth API functions
// ─────────────────────────────────────────────────────────────

/**
 * Handle Login request directly with Backend API
 */
export async function login(credentials: LoginRequest, rememberMe = true): Promise<AuthResponse> {
  const trimmedUsername = credentials.username.trim();

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: trimmedUsername,
        password: credentials.password,
      }),
    });
  } catch {
    throw {
      status: 0,
      message: "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ Backend đang chạy tại cổng 3000.",
      errors: null,
    } as BackendError;
  }

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw errorData;
  }

  const result = (await response.json()) as ApiResponse<AuthResponse>;
  const authData = result.data;

  // Save real JWT token and user details to localStorage
  saveAuthSession(authData, rememberMe);
  return authData;
}

/**
 * Handle Register request directly with Backend API
 */
export async function register(
  data: RegisterRequest,
): Promise<ApiResponse<RegisterResponseData>> {
  let response: Response;
  try {
    // Only send the exact fields required by the backend validator
    const payload = {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      shippingAddress: data.shippingAddress.trim(),
      username: data.username.trim(),
      password: data.password,
    };

    response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw {
      status: 0,
      message: "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ Backend đang chạy tại cổng 3000.",
      errors: null,
    } as BackendError;
  }

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw errorData;
  }

  return (await response.json()) as ApiResponse<RegisterResponseData>;
}

/**
 * Request password reset (Forgot Password)
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<ForgotPasswordResponseData>> {
  const trimmed = payload.identifier.trim();

  let response: Response | null = null;
  let networkFailed = false;

  try {
    response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: trimmed }),
    });
  } catch {
    networkFailed = true;
  }

  if (networkFailed) {
    throw {
      status: 0,
      message: "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ Backend đang chạy tại cổng 3000.",
      errors: null,
    } as BackendError;
  }

  if (!response || !response.ok) {
    const errorData = response ? await parseErrorResponse(response) : { message: "Lỗi kết nối", status: 500 };
    throw errorData;
  }

  return (await response.json()) as ApiResponse<ForgotPasswordResponseData>;
}

/**
 * Reset password using OTP code
 */
export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ApiResponse<{ username: string }>> {
  const trimmedIdentifier = payload.identifier.trim();
  const trimmedOtp = payload.otp.trim();

  let response: Response | null = null;
  let networkFailed = false;

  try {
    response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: trimmedIdentifier, otp: trimmedOtp, newPassword: payload.newPassword }),
    });
  } catch {
    networkFailed = true;
  }

  if (networkFailed) {
    throw {
      status: 0,
      message: "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ Backend đang chạy tại cổng 3000.",
      errors: null,
    } as BackendError;
  }

  if (!response || !response.ok) {
    const errorData = response ? await parseErrorResponse(response) : { message: "Lỗi kết nối", status: 500 };
    throw errorData;
  }

  return (await response.json()) as ApiResponse<{ username: string }>;
}

/**
 * Fetch current user profile with JWT from Backend
 */
export async function fetchCurrentUser(): Promise<User> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Không tìm thấy Access Token");
  }

  // If running with mock demo token, return stored user
  if (token.startsWith("mock-jwt-token")) {
    const localUser = getCurrentUser();
    if (localUser) return localUser;
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw errorData;
  }

  const res = await response.json();
  const user = res.data?.user as User;
  if (user) {
    getActiveStorage().setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
  return user;
}

// ─────────────────────────────────────────────────────────────
// Session management
// ─────────────────────────────────────────────────────────────

/**
 * Lưu auth session vào storage phù hợp.
 * rememberMe=true → localStorage (nhớ sau khi tắt trình duyệt)
 * rememberMe=false → sessionStorage (mất khi đóng tab)
 */
export function saveAuthSession(data: AuthResponse, rememberMe = true): void {
  const storage = pickStorage(rememberMe);
  if (data.accessToken) {
    storage.setItem(STORAGE_KEYS.TOKEN, data.accessToken);
  }
  if (data.user) {
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  }
  // Lưu lại lựa chọn để các hàm getter biết tìm ở đâu
  storage.setItem(STORAGE_KEYS.REMEMBER, rememberMe ? "1" : "0");
}

/**
 * Get current user from active storage
 */
export function getCurrentUser(): User | null {
  try {
    const stored = getActiveStorage().getItem(STORAGE_KEYS.USER);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Get current access token from active storage
 */
export function getAccessToken(): string | null {
  return getActiveStorage().getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Kiểm tra user đã đăng nhập và token chưa hết hạn.
 * Nếu token hết hạn → tự động xoá session và trả về false.
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  // Mock demo tokens không có exp → luôn hợp lệ
  if (token.startsWith("mock-jwt-token")) return true;

  if (isTokenExpired(token)) {
    // Token hết hạn → dọn session, bắt user đăng nhập lại
    logout();
    return false;
  }

  return true;
}

/**
 * Clear session from both storages (để chắc chắn không còn sót)
 */
export function logout(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  // Xóa thêm các key tương thích ngược
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

/**
 * Return default redirect path based on user's role
 */
export function getRedirectPathByRole(role?: string): string {
  const normalized = (role || "").trim().toLowerCase();
  if (normalized.includes("admin")) {
    return "/admin";
  }
  if (normalized.includes("farmer")) {
    return "/farmer";
  }
  return "/customer";
}
