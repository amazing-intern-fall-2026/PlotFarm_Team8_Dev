import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./features/auth/AuthPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import CustomerPage from "./features/customer/CustomerPage";
import FarmerLayout from "./features/farmer/FarmerLayout";
import AdminLayout from "./features/admin/AdminLayout";
import { getCurrentUser, getRedirectPathByRole, isAuthenticated } from "./features/auth/auth.api";
import FarmDetailPage from "./features/customer/FarmDetailPage";
import MyPlotsPage from "./features/customer/MyPlotsPage";

export default function App() {
  function getDefaultRedirect() {
    if (!isAuthenticated()) {
      return "/login";
    }
    const user = getCurrentUser();
    return getRedirectPathByRole(user?.role);
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />

      {/* Admin Protected Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      />

      {/* Farmer Protected Portal */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/*"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      />

     {/* Customer Protected Portal */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/farms"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/farms/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
          <FarmDetailPage />
        </ProtectedRoute>
        }
      />
      <Route
        path="/customer/my-plots"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <MyPlotsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerPage />
          </ProtectedRoute>
        }
      />


      {/* Default index route: redirect to role portal if authenticated, else /login */}
      <Route
        path="/"
        element={<Navigate to={getDefaultRedirect()} replace />}
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


