import { useAuth } from "@/hooks/useAuth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { hasAnyRole } from "@shared/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextParam = encodeURIComponent(location);
    return <Redirect to={`/login?next=${nextParam}`} />;
  }

  if (roles && user && !hasAnyRole(user.role, roles)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
