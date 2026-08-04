import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { StaffMember } from "@/pages/Staff";

interface RemoveStaffDialogProps {
  staff: StaffMember;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function RemoveStaffDialog({ staff, onClose, onRemove }: RemoveStaffDialogProps) {
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Remove Staff Member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Remove <span className="font-medium text-foreground">{staff.name}</span>? They will lose dashboard access immediately.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onRemove(staff.id); onClose(); }}>Remove</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
