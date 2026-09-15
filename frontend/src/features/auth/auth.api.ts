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

// Predefined demo accounts for testing without seeded database
export type DemoRoleKey = "farmer" | "farmer1" | "farmer2" | "farmer3" | "admin" | "customer";

export const DEMO_ACCOUNTS: Record<DemoRoleKey, User> = {
  farmer: {
    id: "NV0001",
    accountId: "farmer",
    username: "farmer",
    email: "farmer@plotfarm.com",
    fullName: "Lê Văn Canh Tác (Nông Dân)",
    role: "FARMER",
    userType: "EMPLOYEE",
  },
  farmer1: {
    id: "NV0001",
    accountId: "farmer1",
    username: "farmer1",
    email: "farmer@plotfarm.com",
    fullName: "Lê Văn Canh Tác (Lâm Đồng & Bảo Lộc)",
    role: "FARMER",
    userType: "EMPLOYEE",
  },
  farmer2: {
    id: "NV0002",
    accountId: "farmer2",
    username: "farmer2",
    email: "farmer2@plotfarm.com",
    fullName: "Nguyễn Thị Đồng Ruộng (Củ Chi)",
    role: "FARMER",
    userType: "EMPLOYEE",
  },
  farmer3: {
    id: "NV0003",
    accountId: "farmer3",
    username: "farmer3",
    email: "farmer3@plotfarm.com",
    fullName: "Trần Văn Vườn (Mê Kông)",
    role: "FARMER",
    userType: "EMPLOYEE",
  },
  admin: {
    id: "NV0010",
    accountId: "admin",
    username: "admin",
    email: "admin@plotfarm.com",
    fullName: "Trần Quản Trị (Admin Hệ Thống)",
    role: "ADMIN",
    userType: "EMPLOYEE",
  },
  customer: {
    id: "KH0001",
    accountId: "customer",
    username: "customer",
    email: "customer@plotfarm.com",
    fullName: "Nguyễn Văn Nông (Khách Hàng)",
    role: "CUSTOMER",
    userType: "CUSTOMER",
  },
};

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
    // JWT = header.payload.signature — chỉ cần phần payload (index 1)
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return true;
    // Thêm padding để atob() không lỗi
    const padded = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp) return false; // Không có exp → coi như không hết hạn
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Không decode được → coi như hết hạn để an toàn
  }
}

// ─────────────────────────────────────────────────────────────
// Demo account matching
// ─────────────────────────────────────────────────────────────

/**
 * 1-Click login with predefined demo role or specific farmer
 */
export function loginWithDemoRole(role: DemoRoleKey, rememberMe = true): AuthResponse {
  const demoUser = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.farmer;
  const authResponse: AuthResponse = {
    accessToken: `mock-jwt-token-${demoUser.role.toLowerCase()}-${Date.now()}`,
    user: demoUser,
  };
  saveAuthSession(authResponse, rememberMe);
  return authResponse;
}

/**
 * Check if a username or email corresponds to a demo account
 */
function findMatchingDemoAccount(usernameOrEmail: string): User | null {
  const lower = usernameOrEmail.trim().toLowerCase();
  if (lower === "farmer3" || lower.startsWith("farmer3@") || lower.includes("farmer3") || lower.includes("vuon")) {
    return DEMO_ACCOUNTS.farmer3;
  }
  if (lower === "farmer2" || lower.startsWith("farmer2@") || lower.includes("farmer2") || lower.includes("ruong")) {
    return DEMO_ACCOUNTS.farmer2;
  }
  if (lower === "farmer" || lower === "farmer1" || lower.startsWith("farmer@") || lower.includes("farmer")) {
    return DEMO_ACCOUNTS.farmer;
  }
  if (lower === "admin" || lower.startsWith("admin@") || lower.includes("admin")) {
    return DEMO_ACCOUNTS.admin;
  }
  if (lower === "customer" || lower.startsWith("customer@") || lower.includes("customer")) {
    return DEMO_ACCOUNTS.customer;
  }
  return null;
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
 * Handle Login request directly with Backend API.
 * Demo fallback CHỈ kích hoạt khi KHÔNG THỂ KẾT NỐI backend (networkFailed).
 * Nếu backend trả 401 (sai mật khẩu), hiện lỗi thật — KHÔNG fallback mock.
 */
export async function login(credentials: LoginRequest, rememberMe = true): Promise<AuthResponse> {
  const trimmedUsername = credentials.username.trim();
  const matchedDemo = findMatchingDemoAccount(trimmedUsername);

  let response: Response | null = null;
  let networkFailed = false;

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
    networkFailed = true;
  }

  // Fallback demo CHỈ khi không kết nối được backend (KHÔNG phải khi sai mật khẩu)
  if (networkFailed && matchedDemo) {
    const mockAuth: AuthResponse = {
      accessToken: `mock-jwt-token-${matchedDemo.role.toLowerCase()}-${Date.now()}`,
      user: matchedDemo,
    };
    saveAuthSession(mockAuth, rememberMe);
    return mockAuth;
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

  const result = (await response.json()) as ApiResponse<AuthResponse>;
  const authData = result.data;

  // Lưu token theo lựa chọn "Ghi nhớ đăng nhập"
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
