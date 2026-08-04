import { createContext, useContext, useEffect, useState } from "react";
import type { StaffRole } from "@/components/staff/roles";

export interface AuthStaff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  permissions: {
    canApproveCheckIns: boolean;
    canManageExperiences: boolean;
    canManageBookings: boolean;
    canManageGuests: boolean;
    canViewAnalytics: boolean;
    canManageStaff: boolean;
  };
  propertyId: string;
}

interface AuthContextValue {
  staff: AuthStaff | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_URL = import.meta.env.VITE_API_URL || "https://lume-backend-production.up.railway.app/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<AuthStaff | null>(() => {
    try {
      const stored = localStorage.getItem("eb-auth-staff");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("eb-auth-token")
  );

  const logout = () => {
    localStorage.removeItem("eb-auth-token");
    localStorage.removeItem("eb-auth-staff");
    localStorage.removeItem("staffAuthenticated");
    setToken(null);
    setStaff(null);
  };

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }
    localStorage.setItem("eb-auth-token", data.token);
    localStorage.setItem("eb-auth-staff", JSON.stringify(data.staff));
    setToken(data.token);
    setStaff(data.staff);
  };

  return (
    <AuthContext.Provider
      value={{ staff, token, login, logout, isAuthenticated: !!staff && !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
