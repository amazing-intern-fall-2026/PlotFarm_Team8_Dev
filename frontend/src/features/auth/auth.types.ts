export interface LoginRequest {
    emailOrUsername: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmpassword: string;
}

export type UserRole = "customer" | "farmer" | "admin";

export interface User {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    role: UserRole;
    avatarUrl?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface BackendError {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
}


