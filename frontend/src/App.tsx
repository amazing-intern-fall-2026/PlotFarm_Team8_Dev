import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./features/auth/AuthPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import CustomerPage from "./features/customer/CustomerPage";
import FarmerLayout from "./features/farmer/FarmerLayout";
import AdminLayout from "./features/admin/AdminLayout";
import FarmDetailPage from "./features/customer/FarmDetailPage";
import LandingPage from "./features/guest/LandingPage";

export default function App() {

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
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerPage />
          </ProtectedRoute>
        }
      />


      {/* Landing Page for Guest, auto redirects to portal if already authenticated */}
      <Route path="/" element={<LandingPage />} />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


