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

// Predefined demo accounts for testing without seeded database
export type DemoRoleKey = "farmer" | "farmer1" | "farmer2" | "farmer3" | "admin" | "customer";
// DEMO ĐỂ TEST CÁC ROLE CÒN LẠI ĐỪNG XÓA
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

/**
 * 1-Click login with predefined demo role or specific farmer
 */
export function loginWithDemoRole(role: DemoRoleKey): AuthResponse {
  const demoUser = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.farmer;
  const authResponse: AuthResponse = {
    accessToken: `mock-jwt-token-${demoUser.role.toLowerCase()}-${Date.now()}`,
    user: demoUser,
  };
  saveAuthSession(authResponse);
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
 * Handle Login request directly with Backend API, with seamless Demo Fallback
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
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

  // If network failed or backend 401 and this is a demo account, use demo mock session!
  if ((networkFailed || (response && response.status === 401)) && matchedDemo) {
    const mockAuth: AuthResponse = {
      accessToken: `mock-jwt-token-${matchedDemo.role.toLowerCase()}-${Date.now()}`,
      user: matchedDemo,
    };
    saveAuthSession(mockAuth);
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

  // Save token and user details to localStorage
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
