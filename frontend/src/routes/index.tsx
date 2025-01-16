import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterUserForm } from "@/components/auth/register-user-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import CustomerDashboard from "@/components/dashboard/customer-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import LandingPage from "@/components/landing/landing-page";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: string;
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Public Routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
      <Route path="/forgot-password" element={<ForgotPasswordForm />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}