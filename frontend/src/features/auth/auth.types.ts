export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  username: string;
  password: string;
  confirmPassword?: string;
}

export type UserRole = "customer" | "farmer" | "admin" | "CUSTOMER" | "FARMER" | "ADMIN";

export interface User {
  id: string | number;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
  accountId?: string;
  userType?: "CUSTOMER" | "EMPLOYEE" | string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponseData {
  account: {
    username: string;
    role?: string;
  };
  customer?: {
    id: string;
    fullName: string;
    email: string;
  };
  employee?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface BackendFieldError {
  type?: string;
  value?: unknown;
  msg: string;
  path: string;
  location?: string;
}

export interface BackendError {
  message: string;
  status?: number;
  errors?: BackendFieldError[] | Record<string, string[]> | null;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: unknown;
}
