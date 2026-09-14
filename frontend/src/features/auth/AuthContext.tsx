import React, { createContext, useContext, useState, useEffect } from "react";

export interface ContextUser {
  id: string | number;
  username: string;
  email?: string;
  fullName?: string;
  role: "admin" | "farmer" | "customer";
}

interface AuthContextType {
  user: ContextUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string, user: ContextUser) => void;
  logout: () => void;
  setError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ContextUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Khôi phục token và user từ cả 2 quy chuẩn lưu trữ (token/accessToken, user/authUser)
    const savedToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const savedUserStr = localStorage.getItem("user") || localStorage.getItem("authUser");

    if (savedToken && savedUserStr) {
      setToken(savedToken);
      try {
        const parsed = JSON.parse(savedUserStr);
        const normalizedRole = String(parsed.role || "customer").toLowerCase() as "admin" | "farmer" | "customer";
        const normalizedUser: ContextUser = {
          ...parsed,
          role: normalizedRole,
        };
        setUser(normalizedUser);
      } catch (e) {
        console.error("Lỗi parse user từ localStorage", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: ContextUser | any) => {
    const normalizedRole = String(newUser.role || "customer").toLowerCase() as "admin" | "farmer" | "customer";
    const normalizedUser: ContextUser = {
      ...newUser,
      role: normalizedRole,
    };

    setToken(newToken);
    setUser(normalizedUser);

    // Đồng bộ cả 2 bộ khóa để tương thích hoàn toàn
    localStorage.setItem("token", newToken);
    localStorage.setItem("accessToken", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("authUser", JSON.stringify(normalizedUser));
    setError(null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("authUser");
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