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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<AuthStaff | null>(null);
  // The token lives in an httpOnly cookie now — unreadable by JS — so on first
  // load we ask the server whether the cookie is still valid instead of
  // synchronously reading a stored value.
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const logout = async () => {
    setStaff(null);
    try {
      await fetch("/session/logout", { method: "POST", credentials: "include" });
    } catch {
      // Cookie may already be gone server-side; client state is cleared regardless.
    }
  };

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  useEffect(() => {
    fetch("/session/me", { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success) setStaff(data.staff);
      })
      .catch(() => {
        // Treat an unreachable session check as logged-out rather than blocking forever.
      })
      .finally(() => setIsCheckingSession(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }
    setStaff(data.staff);
  };

  return (
    <AuthContext.Provider
      value={{ staff, login, logout, isAuthenticated: !!staff, isCheckingSession }}
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
