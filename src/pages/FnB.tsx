import { useState, useMemo } from "react";
import { useProperty } from "@/context/PropertyContext";
import { Plus, AlertTriangle, Building, Users, CalendarDays, Filter, ChevronLeft, ChevronRight, CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { DiningFacilityCard } from "@/components/dining/DiningFacilityCard";
import { DiningFacilityDialog } from "@/components/dining/DiningFacilityDialog";
import type { DiningFacility } from "@/components/dining/DiningFacilityDialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI } from "@/services/api";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { useWriteAccess } from "@/hooks/useWriteAccess";

// Map API record → DiningFacility shape used by UI components
function apiToFacility(r: any): DiningFacility {
  return {
    id: r._id,
    name: r.name,
    subtitle: r.subtitle || "",
    description: r.description,
    cuisineType: Array.isArray(r.cuisine) ? r.cuisine.join(", ") : (r.cuisineType || ""),
    hours: (r.mealTimes || []).map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(", "),
    image: r.imageUrl || "",
    isActive: r.isActive,
    facilityType: r.facilityType || "restaurant",
    mealTimes: r.mealTimes || [],
    reservationMode: r.bookingMode || "info-only",
    maxGuests: r.maxGuests,
    whatsIncluded: r.whatsIncluded || [],
    guestNote: r.guestNote,
    price: r.price,
    pricingLabel: r.pricingLabel,
    tablesPerNight: r.tablesPerNight,
    blockedDates: r.blockedDates || [],
  };
}

// Map DiningFacility shape → API payload
function facilityToPayload(f: Partial<DiningFacility>, propertyId: string): Record<string, unknown> {
  return {
    name: f.name,
    subtitle: f.subtitle || "",
    description: f.description,
    imageUrl: f.image || "https://placehold.co/800x600?text=Dining",
    propertyId,
    isActive: f.isActive ?? true,
    facilityType: f.facilityType || "restaurant",
    cuisine: f.cuisineType ? [f.cuisineType] : [],
    mealTimes: f.mealTimes || [],
    bookingMode: f.reservationMode || "info-only",
    maxGuests: f.maxGuests,
    whatsIncluded: f.whatsIncluded || [],
    guestNote: f.guestNote || "",
    price: f.price,
    pricingLabel: f.pricingLabel || "",
    tablesPerNight: f.tablesPerNight,
    blockedDates: (f.blockedDates || []).map((d: any) =>
      d instanceof Date ? format(d, "yyyy-MM-dd") : d
    ),
  };
}

// Map API reservation → local Reservation shape
type Reservation = {
  id: string;
  guestName: string;
  facilityName: string;
  facilityId: string;
  facilityType: "restaurant" | "intimate_dining";
  date: string;
  numberOfGuests: number;
  status: "confirmed" | "cancelled";
  roomNumber?: string;
  mainStayBookingId?: string;
};

function apiToReservation(r: any): Reservation {
  return {
    id: r._id,
    guestName: r.guestName,
    facilityName: r.facilityName,
    facilityId: r.facilityId,
    facilityType: r.facilityType,
    date: r.date,
    numberOfGuests: r.numberOfGuests,
    status: r.status,
    roomNumber: r.roomNumber || undefined,
    mainStayBookingId: r.mainStayBookingId || undefined,
  };
}

export default function FnB() {
  const { selectedProperty } = useProperty();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();

  // ── Facilities ──────────────────────────────────────────────────────────────
  const { data: rawFacilities = [], isLoading: facilitiesLoading } = useQuery({
    queryKey: ["dining-facilities", selectedProperty.id],
    queryFn: () => dashboardAPI.getAllRestaurants(selectedProperty.id),
  });

  const facilities: DiningFacility[] = rawFacilities.map(apiToFacility);
  const activeFacilities = facilities.filter(f => f.isActive);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => dashboardAPI.createRestaurant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dining-facilities"] });
      toast({ title: "Success", description: "New facility created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to create facility", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => dashboardAPI.updateRestaurant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dining-facilities"] });
      toast({ title: "Success", description: "Facility updated successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to update facility", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dining-facilities"] });
      toast({ title: "Facility deleted", description: "Dining facility removed." });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to delete facility", variant: "destructive" }),
  });

  const [selectedFacility, setSelectedFacility] = useState<DiningFacility | null>(null);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);

  const handleEditFacility = (facility: DiningFacility) => { setSelectedFacility(facility); setFacilityDialogOpen(true); };
  const handleAddFacility = () => { setSelectedFacility(null); setFacilityDialogOpen(true); };
  const handleDeleteFacility = (id: string) => { deleteMutation.mutate(id); };

  const handleSaveFacility = (facilityData: Partial<DiningFacility>) => {
    const payload = facilityToPayload(facilityData, selectedProperty.id);
    if (selectedFacility?.id) {
      updateMutation.mutate({ id: selectedFacility.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setFacilityDialogOpen(false);
  };

  // ── Reservations ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservationFilterFacility, setReservationFilterFacility] = useState("all");
  const [reservationFilterType, setReservationFilterType] = useState("all");
  const [reservationFilterStatus, setReservationFilterStatus] = useState("all");
  const [addReservationOpen, setAddReservationOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [newReservation, setNewReservation] = useState({ guestName: "", facilityId: "", facilityName: "", date: "", guests: "2", mainStayBookingId: "" });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: rawReservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["dining-reservations", selectedProperty.id, selectedDateStr],
    queryFn: () => dashboardAPI.getDiningReservations({ date: selectedDateStr, propertyId: selectedProperty.id }),
  });

  const reservations: Reservation[] = rawReservations.map(apiToReservation);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.cancelDiningReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dining-reservations", selectedDateStr] });
      setCancelConfirmId(null);
      toast({ title: "Reservation Cancelled", description: "The reservation has been cancelled." });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to cancel", variant: "destructive" }),
  });

  const addReservationMutation = useMutation({
    mutationFn: (data: any) => dashboardAPI.createManualDiningReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dining-reservations", selectedDateStr] });
      setNewReservation({ guestName: "", facilityId: "", facilityName: "", date: "", guests: "2", mainStayBookingId: "" });
      setAddReservationOpen(false);
      toast({ title: "Reservation Added", description: `Reservation for ${newReservation.guestName} created` });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to add reservation", variant: "destructive" }),
  });

  const handleCancelReservation = (id: string) => { cancelMutation.mutate(id); };

  const selectedFacilityForNew = facilities.find(f => f.id === newReservation.facilityId);

  const handleAddReservation = () => {
    if (!newReservation.guestName || !newReservation.facilityId || !newReservation.date) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const fac = selectedFacilityForNew;
    const guestCount = fac?.facilityType === "intimate_dining" && fac.maxGuests
      ? fac.maxGuests
      : parseInt(newReservation.guests) || 2;

    addReservationMutation.mutate({
      facilityId: newReservation.facilityId,
      facilityName: newReservation.facilityName,
      facilityType: fac?.facilityType || "restaurant",
      guestName: newReservation.guestName,
      date: newReservation.date,
      numberOfGuests: guestCount,
      propertyId: selectedProperty.id,
      mainStayBookingId: newReservation.mainStayBookingId.trim() || undefined,
    });
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    if (reservationFilterFacility !== "all") filtered = filtered.filter(r => r.facilityId === reservationFilterFacility);
    if (reservationFilterType !== "all") filtered = filtered.filter(r => r.facilityType === reservationFilterType);
    if (reservationFilterStatus !== "all") filtered = filtered.filter(r => r.status === reservationFilterStatus);
    return filtered.sort((a, b) => {
      if (a.status === "cancelled" && b.status !== "cancelled") return 1;
      if (a.status !== "cancelled" && b.status === "cancelled") return -1;
      return a.facilityName.localeCompare(b.facilityName);
    });
  }, [reservations, reservationFilterFacility, reservationFilterType, reservationFilterStatus]);

  // Disable dates for the Add Reservation calendar (blocked + sold-out)
  const getDisabledDatesForFacility = (fac: DiningFacility | undefined) => {
    if (!fac || fac.facilityType !== "intimate_dining") {
      return (date: Date) => isBefore(date, startOfDay(new Date()));
    }
    return (date: Date) => {
      if (isBefore(date, startOfDay(new Date()))) return true;
      const dateStr = format(date, "yyyy-MM-dd");
      if (fac.blockedDates?.includes(dateStr)) return true;
      if (fac.tablesPerNight) {
        const bookedCount = reservations.filter(r => r.facilityId === fac.id && r.date === dateStr && r.status === "confirmed").length;
        if (bookedCount >= fac.tablesPerNight) return true;
      }
      return false;
    };
  };

  const fnbBusy = facilitiesLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const fnbLabel = facilitiesLoading ? "Loading facilities…" : createMutation.isPending ? "Creating facility…" : updateMutation.isPending ? "Saving changes…" : deleteMutation.isPending ? "Deleting…" : "";

  return (
    <div className="space-y-6">
      <LoadingBar loading={fnbBusy} label={fnbLabel} />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">F&B Hub</h1>
          <p className="text-muted-foreground">Manage dining facilities and F&B operations</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="facilities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facilities">Dining Facilities</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="space-y-6">
          {canWrite && (
            <div className="flex justify-end">
              <Button onClick={handleAddFacility} className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Dining Facility
              </Button>
            </div>
          )}

          {!facilitiesLoading && facilities.some(f => !f.isActive) && (
            <Card className="border-warning/20 bg-warning/5 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <div className="font-medium text-warning">{facilities.filter(f => !f.isActive).length} facility(ies) currently inactive</div>
                    <div className="text-sm text-muted-foreground">Check facility status to ensure optimal service availability</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {facilitiesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : facilities.length === 0 ? (
            <Card className="shadow-soft border-dashed">
              <CardContent className="p-12 text-center">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Dining Facilities</h3>
                <p className="text-muted-foreground mb-6">Start by adding your first dining facility to begin managing your F&B operations.</p>
                {canWrite && (
                  <Button onClick={handleAddFacility} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Facility
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {facilities.map(facility => (
                <DiningFacilityCard
                  key={facility.id}
                  facility={facility}
                  onEdit={canWrite ? handleEditFacility : undefined}
                  onDelete={canWrite ? handleDeleteFacility : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Table Reservations</h2>
              <p className="text-sm text-muted-foreground">View and manage guest table bookings across all dining facilities</p>
            </div>
            {canWrite && (
              <Button onClick={() => setAddReservationOpen(true)} className="bg-accent hover:bg-accent/90" disabled={activeFacilities.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reservation
              </Button>
            )}
          </div>

          {/* Date Picker Row */}
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDate(prev => subDays(prev, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-center font-medium">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {format(selectedDate, "EEE, dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { if (d) { setSelectedDate(d); setDatePickerOpen(false); } }}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDate(prev => addDays(prev, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Filters:</label>
                </div>
                <Select value={reservationFilterType} onValueChange={setReservationFilterType}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="intimate_dining">Intimate Dining</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reservationFilterFacility} onValueChange={setReservationFilterFacility}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="All Facilities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="flex items-center gap-2">
                          {f.name}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {f.facilityType === "intimate_dining" ? "Intimate" : "Restaurant"}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reservationFilterStatus} onValueChange={setReservationFilterStatus}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="confirmed">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary">{filteredReservations.length} reservations</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reservations Table */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-center">Cancel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <CalendarOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No reservations for {format(selectedDate, "EEE, dd MMM yyyy")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map(reservation => {
                    const isCancelled = reservation.status === "cancelled";
                    return (
                      <TableRow key={reservation.id} className={cn(isCancelled && "opacity-50")}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{reservation.mainStayBookingId || <span className="text-muted-foreground/40">—</span>}</TableCell>
                        <TableCell className="font-medium">{reservation.guestName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {reservation.facilityType === "intimate_dining" ? "Intimate Dining" : "Restaurant"}
                          </Badge>
                        </TableCell>
                        <TableCell>{reservation.facilityName}</TableCell>
                        <TableCell>{reservation.date}</TableCell>
                        <TableCell>{reservation.numberOfGuests}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {reservation.roomNumber || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {isCancelled ? (
                            <Badge className="bg-muted text-muted-foreground border border-border">Cancelled</Badge>
                          ) : (
                            canWrite ? (
                              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => setCancelConfirmId(reservation.id)}>
                                Cancel
                              </Button>
                            ) : null
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DiningFacilityDialog
        open={facilityDialogOpen}
        onOpenChange={setFacilityDialogOpen}
        facility={selectedFacility}
        onSave={handleSaveFacility}
        onImageUpload={async (file) => {
          const { imageUrl } = await dashboardAPI.uploadDiningImage(file);
          return imageUrl;
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelConfirmId} onOpenChange={(open) => { if (!open) setCancelConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this reservation?</DialogTitle>
            <DialogDescription>This action cannot be undone. The reservation will be marked as cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirmId(null)}>Keep</Button>
            <Button variant="destructive" onClick={() => cancelConfirmId && handleCancelReservation(cancelConfirmId)}>Confirm Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reservation Dialog */}
      <Dialog open={addReservationOpen} onOpenChange={setAddReservationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Reservation</DialogTitle>
            <DialogDescription>Add a reservation on behalf of a guest (walk-in, phone booking, or staff request)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Booking ID (optional)</Label>
              <Input
                value={newReservation.mainStayBookingId}
                onChange={e => setNewReservation(p => ({ ...p, mainStayBookingId: e.target.value }))}
                onBlur={async () => {
                  const id = newReservation.mainStayBookingId.trim();
                  if (!id) return;
                  try {
                    const result = await dashboardAPI.getGuestByBookingId(id);
                    if (result?.primaryGuestName) setNewReservation(p => ({ ...p, guestName: result.primaryGuestName }));
                  } catch { /* ignore */ }
                }}
                placeholder="e.g. BK-10234 — auto-fills guest name"
              />
            </div>
            <div className="space-y-2">
              <Label>Guest Name *</Label>
              <Input value={newReservation.guestName} onChange={e => setNewReservation(p => ({ ...p, guestName: e.target.value.slice(0, 60) }))} placeholder="e.g., Ananya Mehta" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label>Facility *</Label>
              <Select value={newReservation.facilityId} onValueChange={v => {
                const fac = activeFacilities.find(f => f.id === v);
                setNewReservation(p => ({
                  ...p,
                  facilityId: v,
                  facilityName: fac?.name || "",
                  guests: fac?.facilityType === "intimate_dining" && fac.maxGuests ? String(fac.maxGuests) : p.guests,
                }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>
                  {activeFacilities.length === 0 ? (
                    <SelectItem value="none" disabled>No active facilities</SelectItem>
                  ) : (
                    activeFacilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="flex items-center gap-2">
                          {f.name}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {f.facilityType === "intimate_dining" ? "Intimate" : "Restaurant"}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReservation.date && "text-muted-foreground")}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {newReservation.date ? format(new Date(newReservation.date), "EEE, dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newReservation.date ? new Date(newReservation.date) : undefined}
                    onSelect={(d) => { if (d) setNewReservation(p => ({ ...p, date: format(d, "yyyy-MM-dd") })); }}
                    disabled={getDisabledDatesForFacility(selectedFacilityForNew)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Number of Guests *</Label>
              {selectedFacilityForNew?.facilityType === "intimate_dining" && selectedFacilityForNew.maxGuests ? (
                <>
                  <Input type="number" value={selectedFacilityForNew.maxGuests} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Set by facility configuration.</p>
                </>
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newReservation.guests}
                  onChange={e => setNewReservation(p => ({ ...p, guests: e.target.value }))}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddReservationOpen(false)}>Cancel</Button>
            <Button onClick={handleAddReservation} className="bg-accent hover:bg-accent/90" disabled={addReservationMutation.isPending}>
              {addReservationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
