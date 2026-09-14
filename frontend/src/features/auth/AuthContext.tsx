/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import type { User } from "./auth.types";
import { getCurrentUser, getAccessToken, logout as apiLogout } from "./auth.api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const current = getCurrentUser();
    if (current) return current;
    try {
      const legacy = localStorage.getItem("user");
      return legacy ? JSON.parse(legacy) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return getAccessToken();
  });

  const [isLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setError(null);
    // saveAuthSession đã được gọi bởi LoginForm với rememberMe đúng
    // AuthContext chỉ cập nhật React state
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    // apiLogout() xóa cả localStorage và sessionStorage
    apiLogout();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};