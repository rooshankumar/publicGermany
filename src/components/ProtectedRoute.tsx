import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import FullScreenLoader from '@/components/FullScreenLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'admin';
  disallowRole?: 'student' | 'admin';
}

const ProtectedRoute = ({ children, requiredRole, disallowRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader label="Checking session" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required but profile hasn't loaded yet, wait briefly instead of redirecting
  if (requiredRole && !profile) {
    return <FullScreenLoader label="Loading profile" />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // If a role is explicitly disallowed for this route (e.g., admin on student pages), redirect
  if (disallowRole && profile?.role === disallowRole) {
    // Send admins to admin dashboard; students to user dashboard
    const redirectPath = disallowRole === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;