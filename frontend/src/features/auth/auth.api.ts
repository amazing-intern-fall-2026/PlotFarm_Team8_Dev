import type {
  ApiResponse,
  AuthResponse,
  BackendError,
  LoginRequest,
  RegisterRequest,
  RegisterResponseData,
  User,
} from "./auth.types";

const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

const STORAGE_KEYS = {
  TOKEN: "accessToken",
  USER: "authUser",
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

/**
 * Handle Login request directly with Backend API
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
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
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
  return user;
}

/**
 * Save auth session to localStorage
 */
export function saveAuthSession(data: AuthResponse): void {
  if (data.accessToken) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.accessToken);
  }
  if (data.user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get current access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/**
 * Clear session and logout
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
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
