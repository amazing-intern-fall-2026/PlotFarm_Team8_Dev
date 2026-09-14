import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Spinner } from "../../components/ui";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // 1. Nếu đang kiểm tra thông tin đăng nhập trong localStorage -> Hiện Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // 2. Nếu chưa đăng nhập (Không có token hoặc user) -> Chuyển về trang /login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Nếu đăng nhập rồi nhưng không đúng Role cho phép (so sánh không phân biệt hoa thường) -> Chuyển về trang /login
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = (user.role || "").toLowerCase().trim();
    const isAllowed = allowedRoles.some(
      (role) => role.toLowerCase().trim() === currentRole,
    );
    if (!isAllowed) {
      return <Navigate to="/login" replace />;
    }
  }

  // Nếu hợp lệ -> Cho phép xem nội dung bên trong
  return <>{children}</>;
}