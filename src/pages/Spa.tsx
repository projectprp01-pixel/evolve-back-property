import { useState, useMemo, useEffect, useRef } from "react";
import { useProperty } from "@/context/PropertyContext";
import { Plus, Settings, ChevronLeft, ChevronRight, X, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { dashboardAPI, type SpaFacilityAPI, type SpaBookingAPI } from "@/services/api";
import { useWriteAccess } from "@/hooks/useWriteAccess";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { SpaPageSettingsDialog, type SpaPageSettings } from "@/components/spa/SpaPageSettingsDialog";
import { AddSpaTreatmentDialog, type SpaTreatmentData, type SpaTimeSlot } from "@/components/spa/AddSpaTreatmentDialog";
import { AddSpaBookingDialog } from "@/components/spa/AddSpaBookingDialog";

// ── Duration helpers ──
function parseDurationToMinutes(display: string): number {
  const hours = display.match(/(\d+)\s*[Hh]our/);
  const mins = display.match(/(\d+)\s*[Mm]in/);
  const result = (hours ? parseInt(hours[1]) * 60 : 0) + (mins ? parseInt(mins[1]) : 0);
  if (result > 0) return result;
  // fallback: plain number string like "75"
  const plain = parseInt(display);
  return plain > 0 ? plain : 60;
}

function minutesToDurationDisplay(minutes: number): string {
  if (!minutes || minutes <= 0) return "60 Minutes";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Minutes`;
  if (m === 0) return `${h} Hour${h > 1 ? "s" : ""}`;
  return `${h} Hour${h > 1 ? "s" : ""} ${m} Minutes`;
}

// ── Helpers to map API data to local types ──

function facilityToPageSettings(f: SpaFacilityAPI | null): SpaPageSettings {
  if (!f) return { name: "", subtitle: "", description: "", coverImage: "" };
  return {
    name: f.name,
    subtitle: f.subtitle ?? "",
    description: f.description ?? "",
    coverImage: f.listingImage ?? f.detailImage ?? "",
  };
}

function facilityToCategories(f: SpaFacilityAPI | null): string[] {
  if (!f?.categories) return [];
  return f.categories.map(c => c.name);
}

function facilityToTreatments(f: SpaFacilityAPI | null): SpaTreatmentData[] {
  if (!f?.categories) return [];
  const list: SpaTreatmentData[] = [];
  for (const cat of f.categories) {
    for (const t of cat.treatments || []) {
      list.push({
        id: t._id,
        image: t.imageUrl ?? "",
        name: t.name,
        subtitle: t.subtitle ?? "",
        category: cat.name,
        description: t.description ?? "",
        guestCapacityMax: t.capacityMax ?? 2,
        durationDisplay: minutesToDurationDisplay(t.duration),
        price: t.price,
        pricingLabel: t.pricingLabel ?? "Per person",
        timeSlots: (t.timeSlots ?? []).map((s, i) => {
          const [h, m] = (s.startTime ?? "09:00").split(":");
          return { id: `ts-${i}`, label: s.label ?? "", hour: h ?? "09", minute: m ?? "00" };
        }),
        blockedDates: (t.blockedDates ?? []).map(d => new Date(d)),
        isActive: t.isActive ?? true,
      });
    }
  }
  return list;
}

export default function Spa() {
  const canWrite = useWriteAccess();
  const { selectedProperty } = useProperty();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── API queries ──
  const { data: facilities = [], isLoading, isError: spaError } = useQuery({
    queryKey: ["spa", selectedProperty.id],
    queryFn: () => dashboardAPI.getAllSpaFacilities(selectedProperty.id),
    staleTime: 5 * 60_000,
  });
  const selectedFacility = facilities[0] ?? null;

  const pageSettings = useMemo(() => facilityToPageSettings(selectedFacility), [selectedFacility]);
  const apiCategories = useMemo(() => facilityToCategories(selectedFacility), [selectedFacility]);
  const apiTreatments = useMemo(() => facilityToTreatments(selectedFacility), [selectedFacility]);

  // ── Fixed 2 categories ──
  const SPA_CATEGORIES = ["Ayurvedic Treatment", "Beauty Treatment"];
  const categories = SPA_CATEGORIES;

  // ── Local treatments state (starts from API, edits locally) ──
  const [localTreatments, setLocalTreatments] = useState<SpaTreatmentData[] | null>(null);
  const treatments = localTreatments ?? apiTreatments;

  // ── Mutations ──
  const updateFacilityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => dashboardAPI.updateSpaFacility(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa"] });
      toast({ title: "Saved", description: "Spa updated successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed to update", variant: "destructive" }),
  });

  const createFacilityMutation = useMutation({
    mutationFn: () => dashboardAPI.createSpaFacility({
      name: "Vaidyashala",
      propertyId: selectedProperty.id,
      isActive: true,
      categories: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa"] });
      toast({ title: "Spa facility created", description: "You can now add treatments." });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed to create spa facility", variant: "destructive" }),
  });

  // ── Bookings ──
  const [bookingDate, setBookingDate] = useState(new Date());
  const bookingDateStr = format(bookingDate, "yyyy-MM-dd");

  const { data: apiBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["spa-bookings", selectedProperty.id],
    queryFn: () => dashboardAPI.getSpaBookings({ propertyId: selectedProperty.id }),
    enabled: !!selectedFacility,
    staleTime: 5 * 60_000,
  });
  const allBookings = apiBookings;

  const updateBookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SpaBookingAPI["status"] }) => dashboardAPI.updateSpaBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-bookings"] });
      toast({ title: "Updated", description: "Booking status updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" }),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: Parameters<typeof dashboardAPI.createManualSpaBooking>[0]) => dashboardAPI.createManualSpaBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-bookings"] });
      toast({ title: "Booking Added", description: "Spa booking created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" }),
  });

  // ── Global therapist inventory (synced with API) ──
  const [therapistCount, setTherapistCount] = useState(
    selectedFacility?.therapistsAvailable ?? 1
  );
  const [therapistRaw, setTherapistRaw] = useState(String(selectedFacility?.therapistsAvailable ?? 1));
  const therapistSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI state ──
  const [spaVisible, setSpaVisible] = useState(selectedFacility?.isActive ?? true);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<SpaTreatmentData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"Active" | "Cancelled" | "All">("Active");
  const [bookingTreatmentFilter, setBookingTreatmentFilter] = useState("All");

  // ── Sync spaVisible + therapistCount when facility loads from API ──
  useEffect(() => {
    if (selectedFacility) {
      setSpaVisible(selectedFacility.isActive ?? true);
      const t = selectedFacility.therapistsAvailable ?? 1;
      setTherapistCount(t);
      setTherapistRaw(String(t));
    }
  }, [selectedFacility?._id]);

  // ── Auto-migrate old category names to new ones (one-time) ──
  const hasMigratedRef = useRef(false);
  useEffect(() => {
    if (!selectedFacility || hasMigratedRef.current) return;
    const OLD_TO_NEW: Record<string, string> = {
      "Wellness Treatments": "Ayurvedic Treatment",
      "Beauty Treatments": "Beauty Treatment",
      "Ayurvedic Beauty Treatment": "Beauty Treatment",
    };
    const hasOldNames = (selectedFacility.categories ?? []).some(
      c => !SPA_CATEGORIES.includes(c.name)
    );
    if (!hasOldNames) { hasMigratedRef.current = true; return; }
    hasMigratedRef.current = true;

    const allTreats = facilityToTreatments(selectedFacility);
    const catMap = new Map<string, Array<Record<string, unknown>>>();
    for (const cat of SPA_CATEGORIES) catMap.set(cat, []);
    for (const t of allTreats) {
      const targetCat = OLD_TO_NEW[t.category] ?? SPA_CATEGORIES[0];
      catMap.get(targetCat)!.push({
        _id: t.id.startsWith("treatment_") ? undefined : t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        duration: parseDurationToMinutes(t.durationDisplay),
        subtitle: t.subtitle,
        pricingLabel: t.pricingLabel,
        capacityMax: t.guestCapacityMax,
        isActive: t.isActive,
        timeSlots: t.timeSlots.map(s => ({ label: s.label, startTime: `${s.hour}:${s.minute}` })),
        blockedDates: t.blockedDates,
      });
    }
    const newCats = Array.from(catMap.entries()).map(([name, trs]) => ({ name, treatments: trs }));
    updateFacilityMutation.mutate({ id: selectedFacility._id, data: { categories: newCats } });
  }, [selectedFacility?._id]);

  // ── Treatment handlers ──
  const handleSaveTreatment = (data: SpaTreatmentData) => {
    if (!selectedFacility) {
      createFacilityMutation.mutate();
      toast({ title: "Setting up spa facility", description: "Please try again in a moment." });
      return;
    }
    const existingTreatments = localTreatments ?? apiTreatments;
    const isEdit = existingTreatments.some(t => t.id === data.id);

    if (isEdit) {
      setLocalTreatments(existingTreatments.map(t => t.id === data.id ? data : t));
    } else {
      setLocalTreatments([...existingTreatments, data]);
    }

    // Persist to API
    const allTreats = isEdit
      ? existingTreatments.map(t => t.id === data.id ? data : t)
      : [...existingTreatments, data];

    const catMap = new Map<string, Array<Record<string, unknown>>>();
    for (const cat of categories) catMap.set(cat, []);
    for (const t of allTreats) {
      // Remap treatments with unrecognised categories to the first valid category
      const targetCat = catMap.has(t.category) ? t.category : categories[0];
      const arr = catMap.get(targetCat)!;
      arr.push({
        _id: t.id.startsWith("treatment_") ? undefined : t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        duration: parseDurationToMinutes(t.durationDisplay),
        subtitle: t.subtitle,
        pricingLabel: t.pricingLabel,
        capacityMax: t.guestCapacityMax,
        isActive: t.isActive,
        timeSlots: t.timeSlots.map(s => ({ label: s.label, startTime: `${s.hour}:${s.minute}` })),
        blockedDates: t.blockedDates,
      });
    }
    const newCats = Array.from(catMap.entries()).map(([name, trs]) => ({ name, treatments: trs }));
    updateFacilityMutation.mutate({ id: selectedFacility._id, data: { categories: newCats } });
    toast({ title: isEdit ? "Updated" : "Added", description: `Treatment ${isEdit ? "updated" : "added"} successfully` });
    setEditingTreatment(null);
  };

  const handleDeleteTreatment = (id: string) => {
    if (!selectedFacility) return;
    const existing = localTreatments ?? apiTreatments;
    const updated = existing.filter(t => t.id !== id);
    setLocalTreatments(updated);

    const catMap = new Map<string, Array<Record<string, unknown>>>();
    for (const cat of categories) catMap.set(cat, []);
    for (const t of updated) {
      const targetCat = catMap.has(t.category) ? t.category : categories[0];
      const arr = catMap.get(targetCat)!;
      arr.push({
        name: t.name, description: t.description, price: t.price,
        duration: parseDurationToMinutes(t.durationDisplay),
        imageUrl: t.image, subtitle: t.subtitle, pricingLabel: t.pricingLabel,
        capacityMax: t.guestCapacityMax,
        isActive: t.isActive,
        timeSlots: t.timeSlots.map(s => ({ label: s.label, startTime: `${s.hour}:${s.minute}` })),
        blockedDates: t.blockedDates,
      });
    }
    const newCats = Array.from(catMap.entries()).filter(([_, ts]) => ts.length > 0).map(([name, trs]) => ({ name, treatments: trs }));
    updateFacilityMutation.mutate({ id: selectedFacility._id, data: { categories: newCats } });
    toast({ title: "Deleted", description: "Treatment removed" });
  };

  const handleToggleTreatmentActive = (id: string) => {
    if (!selectedFacility) return;
    const existing = localTreatments ?? apiTreatments;
    const updated = existing.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    setLocalTreatments(updated);

    // Persist to API
    const catMap = new Map<string, Array<Record<string, unknown>>>();
    for (const cat of categories) catMap.set(cat, []);
    for (const t of updated) {
      const targetCat = catMap.has(t.category) ? t.category : categories[0];
      const arr = catMap.get(targetCat)!;
      arr.push({
        _id: t.id.startsWith("treatment_") ? undefined : t.id,
        name: t.name, description: t.description, price: t.price,
        duration: parseDurationToMinutes(t.durationDisplay),
        imageUrl: t.image, subtitle: t.subtitle, pricingLabel: t.pricingLabel,
        capacityMax: t.guestCapacityMax,
        isActive: t.isActive,
        timeSlots: t.timeSlots.map(s => ({ label: s.label, startTime: `${s.hour}:${s.minute}` })),
        blockedDates: t.blockedDates,
      });
    }
    const newCats = Array.from(catMap.entries()).map(([name, trs]) => ({ name, treatments: trs }));
    updateFacilityMutation.mutate({ id: selectedFacility._id, data: { categories: newCats } });
  };

  // ── Spa page settings save ──
  const handleSavePageSettings = (s: SpaPageSettings) => {
    if (!selectedFacility) return;
    updateFacilityMutation.mutate({
      id: selectedFacility._id,
      data: { name: s.name, subtitle: s.subtitle, description: s.description, coverImage: s.coverImage },
    });
  };

  // ── Booking handlers ──
  const handleAddBooking = (data: { guestName: string; treatmentId: string; treatmentName: string; date: string; timeSlot: string; numberOfGuests: number; price: number; mainStayBookingId?: string }) => {
    if (!selectedFacility) return;
    createBookingMutation.mutate({
      spaFacilityId: selectedFacility._id,
      treatmentId: data.treatmentId,
      treatmentName: data.treatmentName,
      guestName: data.guestName,
      date: data.date,
      timeSlot: data.timeSlot,
      price: data.price,
      propertyId: selectedProperty.id,
      status: "Upcoming",
      mainStayBookingId: data.mainStayBookingId,
    } as any, { onSuccess: () => setBookingDialogOpen(false) });
  };

  const handleCancelBooking = (id: string) => {
    updateBookingStatusMutation.mutate({ id, status: "Cancelled" });
  };

  // ── Filtered data ──
  const filteredTreatments = categoryFilter === "All" ? treatments : treatments.filter(t => t.category === categoryFilter);

  const dateFilteredBookings = allBookings.filter(b => {
    const bDate = new Date(b.date).toDateString();
    return bDate === bookingDate.toDateString();
  });

  const filteredBookings = dateFilteredBookings
    .filter(b => {
      if (bookingStatusFilter === "Active") return b.status !== "Cancelled";
      if (bookingStatusFilter === "Cancelled") return b.status === "Cancelled";
      return true;
    })
    .filter(b => bookingTreatmentFilter === "All" || b.treatmentName === bookingTreatmentFilter)
    .sort((a, b) => {
      if (a.status === "Cancelled" && b.status !== "Cancelled") return 1;
      if (a.status !== "Cancelled" && b.status === "Cancelled") return -1;
      return 0;
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Spa Hub</h1>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (spaError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Spa Hub</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-muted-foreground text-sm">Unable to load spa data. The server may be starting up.</p>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["spa"] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedFacility) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Spa Hub</h1>
          <p className="text-muted-foreground">Manage treatments and spa bookings</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg gap-4">
          <p className="text-muted-foreground text-sm">No spa facility set up yet.</p>
          <Button
            onClick={() => createFacilityMutation.mutate()}
            disabled={createFacilityMutation.isPending}
          >
            {createFacilityMutation.isPending ? "Setting up..." : "Set Up Spa"}
          </Button>
        </div>
      </div>
    );
  }

  const spaBusy = isLoading || updateFacilityMutation.isPending || createFacilityMutation.isPending;
  const spaLabel = isLoading ? "Loading spa hub…" : createFacilityMutation.isPending ? "Setting up spa…" : updateFacilityMutation.isPending ? "Saving changes…" : "";

  return (
    <div className="space-y-6">
      <LoadingBar loading={spaBusy} label={spaLabel} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spa Hub</h1>
          <p className="text-muted-foreground">Manage treatments and spa bookings</p>
        </div>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-sm font-medium mb-2">Spa Web App Page Details</p>
            {canWrite && (
              <Button variant="outline" size="sm" onClick={() => setPageSettingsOpen(true)} className="h-8 text-xs">
                <Settings className="h-3.5 w-3.5 mr-1.5" /> Edit Details
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-sm font-medium mb-2">Guest Visibility</p>
            <div className="flex items-center gap-2">
              <Switch checked={spaVisible} onCheckedChange={(checked) => {
                setSpaVisible(checked);
                if (selectedFacility) {
                  updateFacilityMutation.mutate({ id: selectedFacility._id, data: { isActive: checked } });
                }
              }} />
              <span className={cn("text-xs font-medium", spaVisible ? "text-green-600" : "text-muted-foreground")}>
                {spaVisible ? "Visible" : "Hidden"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-sm font-medium mb-2">Therapists Available</p>
            <Input
              type="text"
              inputMode="numeric"
              value={therapistRaw}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setTherapistRaw(raw);
                const num = Number(raw);
                if (raw !== "" && num >= 1 && selectedFacility) {
                  setTherapistCount(num);
                  if (therapistSaveTimer.current) clearTimeout(therapistSaveTimer.current);
                  therapistSaveTimer.current = setTimeout(() => {
                    updateFacilityMutation.mutate({ id: selectedFacility._id, data: { therapistsAvailable: num } });
                  }, 800);
                }
              }}
              onBlur={() => {
                if (therapistSaveTimer.current) clearTimeout(therapistSaveTimer.current);
                const v = Math.max(1, Number(therapistRaw) || 1);
                setTherapistCount(v);
                setTherapistRaw(String(v));
                if (selectedFacility) {
                  updateFacilityMutation.mutate({ id: selectedFacility._id, data: { therapistsAvailable: v } });
                }
              }}
              className="w-20 h-8"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="treatments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        {/* ── TREATMENTS TAB ── */}
        <TabsContent value="treatments" className="space-y-6">
          {/* Category labels */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold">Treatment Categories</Label>
            {SPA_CATEGORIES.map(c => (
              <Badge key={c} variant="secondary" className="px-3 py-1 text-sm">{c}</Badge>
            ))}
          </div>

          {/* Filter + Count + Add */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredTreatments.length} treatments</span>
            </div>
            {canWrite && (
              <Button onClick={() => { setEditingTreatment(null); setTreatmentDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Treatment
              </Button>
            )}
          </div>

          {/* Treatment listing */}
          <div className="space-y-3">
            {filteredTreatments.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No treatments found. Add your first treatment to get started.
                </CardContent>
              </Card>
            )}
            {filteredTreatments.map(t => (
              <Card key={t.id} className={cn("transition-opacity", !t.isActive && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{t.name}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">{t.category}</Badge>
                        </div>
                        {t.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.durationDisplay}</span>
                          <span>👥 Up to {t.guestCapacityMax} guests</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-lg">₹{t.price.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">{t.pricingLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={t.isActive} onCheckedChange={() => handleToggleTreatmentActive(t.id)} />
                        {canWrite && <Button variant="outline" size="sm" onClick={() => { setEditingTreatment(t); setTreatmentDialogOpen(true); }}>Edit</Button>}
                        {canWrite && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteTreatment(t.id)}>Delete</Button>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── BOOKINGS TAB ── */}
        <TabsContent value="bookings" className="space-y-6">
          {/* Date picker filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setBookingDate(d => subDays(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-center font-medium">
                    {format(bookingDate, "EEE, dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={bookingDate} onSelect={d => d && setBookingDate(d)} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setBookingDate(d => addDays(d, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="ml-2">{dateFilteredBookings.length} bookings</Badge>
            </div>
            {canWrite && (
              <Button onClick={() => setBookingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Booking
              </Button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3">
            <Select value={bookingTreatmentFilter} onValueChange={setBookingTreatmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="All">All Treatments</SelectItem>
                {treatments.filter(t => t.isActive).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(["Active", "Cancelled", "All"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setBookingStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    bookingStatusFilter === s ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{filteredBookings.length} bookings</span>
          </div>

          {/* Bookings table */}
          <Card>
            {bookingsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Ref</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings for this date.</TableCell>
                    </TableRow>
                  )}
                  {filteredBookings.map(b => {
                    const isCancelled = b.status === "Cancelled";
                    return (
                      <TableRow key={b._id} className={cn(isCancelled && "opacity-50")}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{b.mainBookingId || <span className="text-muted-foreground/40">—</span>}</TableCell>
                        <TableCell className="font-medium">{b.guestName}</TableCell>
                        <TableCell>{b.treatmentName}</TableCell>
                        <TableCell>{new Date(b.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</TableCell>
                        <TableCell>{b.timeSlot || "—"}</TableCell>
                        <TableCell>{(b as any).numberOfGuests ?? 1}</TableCell>
                        <TableCell>₹{b.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {isCancelled ? (
                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                          ) : canWrite ? (
                            <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleCancelBooking(b._id)}>
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Active</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SpaPageSettingsDialog open={pageSettingsOpen} onOpenChange={setPageSettingsOpen} settings={pageSettings} onSave={handleSavePageSettings} />
      <AddSpaTreatmentDialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen} treatment={editingTreatment} categories={categories} onSave={handleSaveTreatment} isPending={updateFacilityMutation.isPending} />
      <AddSpaBookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} treatments={treatments} onSave={handleAddBooking} isPending={createBookingMutation.isPending} allBookings={allBookings} therapistCount={therapistCount} />
    </div>
  );
}
