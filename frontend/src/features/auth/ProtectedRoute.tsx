import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, getRedirectPathByRole, isAuthenticated } from "./auth.api";
import type { UserRole } from "./auth.types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect unauthenticated user to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getCurrentUser();

  // If role is specified and current user's role is not authorized for this route
  if (allowedRoles && user) {
    const userRole = (user.role || "").trim().toLowerCase();
    const isAllowed = allowedRoles.some(
      (role) =>
        userRole === role.toLowerCase() || userRole.includes(role.toLowerCase()),
    );

    if (!isAllowed) {
      // Redirect to user's proper role portal
      return <Navigate to={getRedirectPathByRole(user.role)} replace />;
    }
  }

  return <>{children}</>;
}


