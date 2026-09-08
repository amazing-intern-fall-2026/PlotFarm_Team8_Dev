import type {
  AuthResponse,
  BackendError,
  LoginRequest,
  RegisterRequest,
  User,
} from "./auth.types";

const API_URL = import.meta.env.VITE_API_URL || "";

// Mock accounts for offline / demo testing
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: "customer",
    email: "customer@plotfarm.com",
    fullName: "Nguyễn Văn Nông (Khách hàng)",
    role: "customer",
  },
  {
    id: 2,
    username: "farmer",
    email: "farmer@plotfarm.com",
    fullName: "Lê Văn Canh Tác (Nông dân)",
    role: "farmer",
  },
  {
    id: 3,
    username: "admin",
    email: "admin@plotfarm.com",
    fullName: "Trần Quản Trị (Admin Hệ Thống)",
    role: "admin",
  },
];

const STORAGE_KEYS = {
  TOKEN: "accessToken",
  USER: "authUser",
};

/**
 * Helper to simulate network latency for mock calls
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handle Login request
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  // If backend API URL is provided, try real HTTP call
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData: BackendError = {
          message: data.message || data.error || "Đăng nhập không thành công.",
          status: response.status,
          errors: data.errors,
        };
        throw errorData;
      }

      // Ensure normalized user role from backend
      const rawRole =
        data.user?.role || data.role || (data.roles && data.roles[0]) || "customer";
      const normalizedRole: User["role"] = String(rawRole).toLowerCase().includes("admin")
        ? "admin"
        : String(rawRole).toLowerCase().includes("farmer")
        ? "farmer"
        : "customer";

      data.user = {
        ...data.user,
        role: normalizedRole,
      };

      saveAuthSession(data);
      return data;
    } catch (err: unknown) {
      if ((err as BackendError)?.message) {
        throw err;
      }
      console.warn("Backend API không phản hồi, chuyển sang chế độ mô phỏng (Mock):", err);
    }
  }

  // Mock implementation for development & testing
  await delay(600);

  const identifier = credentials.emailOrUsername.trim().toLowerCase();
  const password = credentials.password;

  // Specific simulation cases
  if (identifier === "blocked@plotfarm.com") {
    const error: BackendError = {
      message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
      status: 403,
    };
    throw error;
  }

  // Check matching mock user (supports 'admin', 'admin1', 'admin@plotfarm.com', etc.)
  const matchedUser = MOCK_USERS.find((u) => {
    const userRole = u.role.toLowerCase();
    const userEmail = u.email.toLowerCase();
    const userName = u.username.toLowerCase();

    return (
      userEmail === identifier ||
      userName === identifier ||
      (identifier.startsWith(userRole) && (identifier === userRole || identifier === `${userRole}1` || identifier.includes(userRole)))
    );
  });

  // If matched predefined user
  if (matchedUser) {
    const validPasswords = [
      "password123",
      "123456",
      "admin",
      "admin123",
      "farmer",
      "farmer123",
      "customer",
      "customer123",
    ];

    if (!validPasswords.includes(password) && password.length < 4) {
      const error: BackendError = {
        message: "Mật khẩu không chính xác. Mẹo: Dùng 'password123' hoặc '123456'",
        status: 401,
      };
      throw error;
    }

    const authResponse: AuthResponse = {
      accessToken: `mock-jwt-token-${Date.now()}-${matchedUser.id}`,
      user: matchedUser,
    };

    saveAuthSession(authResponse);
    return authResponse;
  }

  // Any other custom user entered: if password is wrongpass or 111111
  if (password === "wrongpass" || password === "111111") {
    const error: BackendError = {
      message: "Tài khoản hoặc mật khẩu không chính xác (Backend 401 Unauthorized)",
      status: 401,
    };
    throw error;
  }

  // Determine role based on username/email if entered dynamically
  let detectedRole: User["role"] = "customer";
  if (identifier.includes("admin")) {
    detectedRole = "admin";
  } else if (identifier.includes("farmer")) {
    detectedRole = "farmer";
  }

  // Create session for entered username/email
  const newUser: User = {
    id: Date.now(),
    username: identifier.includes("@") ? identifier.split("@")[0] : identifier,
    email: identifier.includes("@") ? identifier : `${identifier}@plotfarm.com`,
    fullName: identifier.includes("@") ? identifier.split("@")[0] : identifier,
    role: detectedRole,
  };

  const authResponse: AuthResponse = {
    accessToken: `mock-jwt-token-${Date.now()}`,
    user: newUser,
  };

  saveAuthSession(authResponse);
  return authResponse;
}


/**
 * Handle Register request
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  // If backend API URL is provided, try real HTTP call
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorData: BackendError = {
          message: resData.message || resData.error || "Đăng ký không thành công.",
          status: response.status,
          errors: resData.errors,
        };
        throw errorData;
      }

      saveAuthSession(resData);
      return resData;
    } catch (err: unknown) {
      if ((err as BackendError)?.message) {
        throw err;
      }
      console.warn("Backend API không phản hồi, chuyển sang chế độ mô phỏng (Mock):", err);
    }
  }

  // Mock implementation for development & testing
  await delay(1000);

  const cleanEmail = data.email.trim().toLowerCase();
  const cleanUsername = data.username.trim().toLowerCase();

  // Test duplicate email error simulation
  if (cleanEmail === "customer@plotfarm.com" || cleanEmail === "owner@plotfarm.com") {
    const error: BackendError = {
      message: "Email này đã được đăng ký trong hệ thống. Vui lòng chọn email khác.",
      status: 400,
    };
    throw error;
  }

  // Test duplicate username error simulation
  if (cleanUsername === "admin" || cleanUsername === "customer1") {
    const error: BackendError = {
      message: "Tên người dùng (Username) này đã có người sử dụng.",
      status: 400,
    };
    throw error;
  }

  const registeredUser: User = {
    id: Date.now(),
    username: data.username.trim(),
    email: cleanEmail,
    fullName: data.username.trim(),
    role: "customer",
  };

  const authResponse: AuthResponse = {
    accessToken: `mock-jwt-token-registered-${Date.now()}`,
    user: registeredUser,
  };

  saveAuthSession(authResponse);
  return authResponse;
}

/**
 * Save auth data to localStorage
 */
export function saveAuthSession(data: AuthResponse): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
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
 * Get current access token
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


