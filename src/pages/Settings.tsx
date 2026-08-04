import { useState, useEffect } from "react";
import { Save, Plus, X, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useWriteAccess } from "@/hooks/useWriteAccess";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canWrite = useWriteAccess();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["property-settings"],
    queryFn: () => dashboardAPI.getPropertySettings(),
  });

  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!settings) return;
    setCheckInTime(settings.checkInTime);
    setCheckOutTime(settings.checkOutTime);
    setEmails(settings.notificationEmails);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof dashboardAPI.updatePropertySettings>[0]) =>
      dashboardAPI.updatePropertySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-settings"] });
      toast({ title: "Settings saved", description: "Property settings have been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleAddEmail = () => {
    const trimmed = newEmail.trim();
    if (trimmed && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSave = () => {
    saveMutation.mutate({
      checkInTime,
      checkOutTime,
      notificationEmails: emails,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Property Settings</h1>
          <p className="text-muted-foreground">Configure your property details and preferences.</p>
        </div>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Property Settings</h1>
        <p className="text-muted-foreground">Configure your property details and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stay Timings</CardTitle>
          <p className="text-sm text-muted-foreground">Set your property's standard check-in and check-out times.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-time">Check-in Time</Label>
              <Input
                id="checkin-time"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-time">Check-out Time</Label>
              <Input
                id="checkout-time"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notification Email Addresses
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add email addresses where property notifications and communications will be sent or received.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {emails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <span className="text-sm text-foreground">{email}</span>
                {canWrite && (
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {canWrite && (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              />
              <Button
                variant="outline"
                onClick={handleAddEmail}
                disabled={!newEmail.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canWrite && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[hsl(var(--sidebar-background))] hover:bg-[hsl(var(--sidebar-background))]/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
