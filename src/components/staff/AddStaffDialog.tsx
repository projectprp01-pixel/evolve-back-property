import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAFF_ROLES, ROLE_ACCESS, type StaffRole } from "./roles";
import type { StaffMember } from "@/pages/Staff";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (member: StaffMember) => void;
}

export function AddStaffDialog({ open, onOpenChange, onAdd }: AddStaffDialogProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactError, setContactError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const reset = () => {
    setName("");
    setMobile("");
    setEmail("");
    setRole("");
    setPassword("");
    setConfirmPassword("");
    setContactError("");
    setPasswordError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() && !email.trim()) {
      setContactError("Add at least one contact method");
      return;
    }
    setContactError("");

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");

    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      role: role as StaffRole,
      active: true,
      password,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="add-name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-mobile">Mobile Number</Label>
              <Input id="add-mobile" value={mobile} onChange={(e) => { setMobile(e.target.value); setContactError(""); }} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="add-email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="add-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setContactError(""); }} placeholder="email@example.com" required />
            </div>
          </div>
          {contactError && <p className="text-sm text-destructive -mt-3">{contactError}</p>}

          <div>
            <Label htmlFor="add-role">Role <span className="text-destructive">*</span></Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
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
              {ROLE_ACCESS[role as StaffRole].join(", ")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="add-password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="add-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
              <Input
                id="add-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>
          {passwordError && <p className="text-sm text-destructive -mt-3">{passwordError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !role}>Add Staff Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
