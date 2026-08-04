import { useAuth } from "@/context/AuthContext";
import { ROLE_CAN_WRITE, type StaffRole } from "@/components/staff/roles";

export function useWriteAccess(): boolean {
  const { staff } = useAuth();
  if (!staff) return false;
  return ROLE_CAN_WRITE[staff.role as StaffRole] ?? false;
}
