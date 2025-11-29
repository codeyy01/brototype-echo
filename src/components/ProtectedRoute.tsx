import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: ('admin' | 'student')[];
}

export const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Handle legacy requireAdmin prop
  if (requireAdmin && role !== 'admin') {
    const redirectTarget = role === 'student' ? '/my-complaints' : '/admin-dashboard';
    return <Navigate to={redirectTarget} replace />;
  }

  // Handle role-based access control
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const redirectTarget = role === 'student' ? '/my-complaints' : '/admin-dashboard';
    return <Navigate to={redirectTarget} replace />;
  }

  return <>{children}</>;
};