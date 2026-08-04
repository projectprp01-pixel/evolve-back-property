import { useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import AddRoomUpgradeForm from "@/components/activities/AddRoomUpgradeForm";
import { useWriteAccess } from "@/hooks/useWriteAccess";

export default function RoomUpgrades() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canWrite = useWriteAccess();

  const handleAddUpgrade = () => {
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    console.log("Room upgrade data:", data);
    toast.success("Room upgrade created successfully!");
    setIsDialogOpen(false);
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <NavLink to="/assets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to App Banners
          </NavLink>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Room Upgrades Management</h1>
          <p className="text-muted-foreground">Create and manage room upgrade options</p>
        </div>
        {canWrite && (
          <Button onClick={handleAddUpgrade} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Upgrade
          </Button>
        )}
      </div>

      {/* Content Area */}
      <Card>
        <CardHeader>
          <CardTitle>Room Upgrades</CardTitle>
          <p className="text-sm text-muted-foreground">
            Room upgrade options and promotional content
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Ready for your room upgrade content!</p>
            <p className="text-sm text-muted-foreground">
              Please share the details you'd like to add for room upgrades.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Room Upgrade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Room Upgrade</DialogTitle>
          </DialogHeader>
          <AddRoomUpgradeForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}