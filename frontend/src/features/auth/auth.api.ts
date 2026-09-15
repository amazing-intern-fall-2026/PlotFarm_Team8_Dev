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
  saveAuthSession(authData);
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
// Storage helpers
// ─────────────────────────────────────────────────────────────

/**
 * Chọn storage phù hợp dựa vào tùy chọn rememberMe
 * rememberMe=true → localStorage, rememberMe=false → sessionStorage
 */
function pickStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

/**
 * Lấy storage đang được dùng, dựa vào flag "rememberMe" đã lưu trước đó.
 * Ưu tiên kiểm tra localStorage trước, rồi mới tới sessionStorage.
 */
function getActiveStorage(): Storage {
  // Kiểm tra localStorage có flag "rememberMe" không
  const lsRemember = localStorage.getItem(STORAGE_KEYS.REMEMBER);
  if (lsRemember !== null) {
    return lsRemember === "1" ? localStorage : sessionStorage;
  }
  // Kiểm tra sessionStorage (trường hợp rememberMe=false)
  const ssRemember = sessionStorage.getItem(STORAGE_KEYS.REMEMBER);
  if (ssRemember !== null) {
    return sessionStorage;
  }
  // Fallback: kiểm tra nếu token tồn tại ở đâu
  if (localStorage.getItem(STORAGE_KEYS.TOKEN)) return localStorage;
  if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) return sessionStorage;
  // Mặc định dùng localStorage
  return localStorage;
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
 * Kiểm tra JWT token đã hết hạn chưa bằng cách decode phần payload.
 * Trả về true nếu token hết hạn hoặc không hợp lệ.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false; // Không có exp → coi như không hết hạn
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Nếu parse lỗi → coi như hết hạn
  }
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
