import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_ACCESS, SECTION_ROUTES, type StaffRole } from "@/components/staff/roles";

interface ProtectedRouteProps {
  sectionName: string;
  children: React.ReactNode;
}

export function ProtectedRoute({ sectionName, children }: ProtectedRouteProps) {
  const { staff } = useAuth();
  if (!staff) return <Navigate to="/" replace />;

  const allowed = ROLE_ACCESS[staff.role as StaffRole] ?? [];
  if (!allowed.includes(sectionName)) {
    const fallbackSection = allowed[0];
    const fallbackRoute = fallbackSection ? SECTION_ROUTES[fallbackSection] : "/";
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}
