import { useState } from "react";
import { useProperty } from "@/context/PropertyContext";
import { Users, Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI, type Staff as StaffAPI } from "@/services/api";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { EditStaffDialog } from "@/components/staff/EditStaffDialog";
import { RemoveStaffDialog } from "@/components/staff/RemoveStaffDialog";
import { ROLE_ACCESS, type StaffRole } from "@/components/staff/roles";

export type StaffMember = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: StaffRole;
  active: boolean;
  password?: string;
};

function apiToMember(s: StaffAPI): StaffMember {
  return {
    id: s._id,
    name: [s.firstName, s.lastName].filter(Boolean).join(' '),
    mobile: s.phone || '',
    email: s.email || '',
    role: s.role as StaffRole,
    active: s.isActive,
  };
}

export default function Staff() {
  const { selectedProperty } = useProperty();
  const queryClient = useQueryClient();
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [removeStaff, setRemoveStaff] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState<'adding' | 'removing' | null>(null);

  function memberToPayload(m: StaffMember) {
    const parts = m.name.trim().split(/\s+/);
    const payload: Record<string, any> = {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || parts[0],
      phone: m.mobile,
      email: m.email,
      role: m.role,
      isActive: m.active,
      propertyId: selectedProperty.id,
      propertyName: selectedProperty.name,
    };
    if (m.password) payload.password = m.password;
    return payload;
  }

  const { data: rawStaff = [], isLoading } = useQuery({
    queryKey: ['staff', selectedProperty.id],
    queryFn: () => dashboardAPI.getAllStaff({ propertyId: selectedProperty.id }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const staffList = rawStaff.map(apiToMember);

  const addMutation = useMutation({
    mutationFn: (m: StaffMember) => dashboardAPI.addStaff(memberToPayload(m)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Staff member added successfully");
    },
    onError: (e: any) => toast.error(e.message || "Failed to add staff member"),
    onSettled: () => setSubmitting(null),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, m }: { id: string; m: StaffMember }) =>
      dashboardAPI.updateStaff(id, memberToPayload(m)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Staff member updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update staff member"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Staff member removed");
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove staff member"),
    onSettled: () => setSubmitting(null),
  });

  const handleAddStaff = (member: StaffMember) => {
    setSubmitting('adding');
    addMutation.mutate(member);
  };

  const handleEditStaff = (updated: StaffMember) => {
    updateMutation.mutate({ id: updated.id, m: updated });
  };

  const handleRemoveStaff = (id: string) => {
    setSubmitting('removing');
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: string) => {
    const member = staffList.find((s) => s.id === id);
    if (!member) return;
    updateMutation.mutate({ id, m: { ...member, active: !member.active } });
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const getAccessSummary = (role: StaffRole) => {
    const sections = ROLE_ACCESS[role] ?? [];
    if (sections.length <= 3) return sections.join(", ");
    return `${sections.slice(0, 3).join(", ")} +${sections.length - 3} more`;
  };

  return (
    <div className="space-y-6">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {submitting === 'adding' ? "Adding staff member…" : "Removing staff member…"}
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Control who has access to the dashboard and what they can see.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No staff added yet.</p>
              <p className="text-sm">Add your first team member to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile / Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dashboard Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">{getInitials(member.name)}</span>
                        </div>
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.mobile || member.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[220px]">
                      {getAccessSummary(member.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.active}
                          onCheckedChange={() => handleToggleActive(member.id)}
                          disabled={updateMutation.isPending}
                        />
                        <span className={member.active ? "text-green-600 text-sm" : "text-muted-foreground text-sm"}>
                          {member.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditStaff(member)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRemoveStaff(member)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStaffDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddStaff} />
      {editStaff && (
        <EditStaffDialog staff={editStaff} onClose={() => setEditStaff(null)} onSave={handleEditStaff} />
      )}
      {removeStaff && (
        <RemoveStaffDialog staff={removeStaff} onClose={() => setRemoveStaff(null)} onRemove={handleRemoveStaff} />
      )}
    </div>
  );
}
