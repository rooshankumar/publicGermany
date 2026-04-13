import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import FullScreenLoader from '@/components/FullScreenLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'admin' | 'editor';
  disallowRole?: 'student' | 'admin' | 'editor';
  allowRoles?: ('student' | 'admin' | 'editor')[];
}

const ProtectedRoute = ({ children, requiredRole, disallowRole, allowRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader label="Checking session" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required but profile hasn't loaded yet, wait briefly instead of redirecting
  if ((requiredRole || allowRoles) && !profile) {
    return <FullScreenLoader label="Loading profile" />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    if (profile?.role === 'editor') return <Navigate to="/editor" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (allowRoles && profile?.role && !allowRoles.includes(profile.role)) {
    if (profile.role === 'editor') return <Navigate to="/editor" replace />;
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // If a role is explicitly disallowed for this route (e.g., admin on student pages), redirect
  if (disallowRole && profile?.role === disallowRole) {
    if (profile.role === 'editor') return <Navigate to="/editor" replace />;
    const redirectPath = disallowRole === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Editors should not access student or admin pages unless explicitly allowed
  if (profile?.role === 'editor' && !requiredRole && !allowRoles) {
    const path = window.location.pathname;
    if (!path.startsWith('/editor') && !path.startsWith('/europass-cv') && path !== '/resources') {
      return <Navigate to="/editor" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;