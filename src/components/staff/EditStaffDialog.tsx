import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { STAFF_ROLES, ROLE_ACCESS, type StaffRole } from "./roles";
import { useAuth } from "@/context/AuthContext";
import { dashboardAPI } from "@/services/api";
import { toast } from "sonner";
import type { StaffMember } from "@/pages/Staff";

interface EditStaffDialogProps {
  staff: StaffMember;
  onClose: () => void;
  onSave: (updated: StaffMember) => void;
}

export function EditStaffDialog({ staff, onClose, onSave }: EditStaffDialogProps) {
  const { staff: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [name, setName] = useState(staff.name);
  const [mobile, setMobile] = useState(staff.mobile);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [contactError, setContactError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() && !email.trim()) {
      setContactError("Add at least one contact method");
      return;
    }
    onSave({ ...staff, name: name.trim(), mobile: mobile.trim(), email: email.trim(), role });
    onClose();
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    setPasswordLoading(true);
    try {
      await dashboardAPI.resetStaffPassword(staff.id, newPassword);
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="edit-name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input id="edit-mobile" value={mobile} onChange={(e) => { setMobile(e.target.value); setContactError(""); }} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setContactError(""); }} placeholder="email@example.com" />
            </div>
          </div>
          {contactError && <p className="text-sm text-destructive -mt-3">{contactError}</p>}

          <div>
            <Label htmlFor="edit-role">Role <span className="text-destructive">*</span></Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role && (
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">This role gives access to: </span>
              {ROLE_ACCESS[role].join(", ")}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !role}>Save Changes</Button>
          </div>
        </form>

        {isAdmin && (
          <>
            <Separator className="my-2" />
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-sm font-medium text-foreground">Reset Password</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                    placeholder="Repeat password"
                  />
                </div>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <div className="flex justify-end">
                <Button type="submit" variant="outline" size="sm" disabled={!newPassword || passwordLoading}>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
