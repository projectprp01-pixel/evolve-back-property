import { useState, useEffect } from "react";
import { useProperty } from "@/context/PropertyContext";
import { useWriteAccess } from "@/hooks/useWriteAccess";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { dashboardAPI } from "@/services/api";

// ── Types ──

interface PriceIncludeItem { id: string; label: string }
interface AttractionItem { id: string; label: string }
interface PricingTier { id: string; fromNights: number; toNights: number; routeLabel: string; price: number }

interface TransportBooking {
  _id: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  nights: number;
  amount: number;
  status: "confirmed" | "cancelled";
  bookingId?: { bookingId?: string } | null;
}

const uid = () => crypto.randomUUID();

// ── Page Content Settings Modal ──

function PageContentModal({
  open, onClose, data, onSave,
}: {
  open: boolean;
  onClose: () => void;
  data: any;
  onSave: (d: any) => void;
}) {
  const [pageTitle, setPageTitle] = useState(data.pageTitle || "");
  const [introText, setIntroText] = useState(data.introText || "");
  const [transfersDescription, setTransfersDescription] = useState(data.transfersDescription || "");
  const [priceIncludes, setPriceIncludes] = useState<PriceIncludeItem[]>(
    (data.priceIncludes || []).map((i: any) => ({ id: i._id || uid(), label: i.label }))
  );
  const [sightseeingIntro, setSightseeingIntro] = useState(data.sightseeingIntro || "");
  const [sightseeingAttractions, setSightseeingAttractions] = useState<AttractionItem[]>(
    (data.sightseeingAttractions || []).map((i: any) => ({ id: i._id || uid(), label: i.label }))
  );

  const addPriceInclude = () => setPriceIncludes([...priceIncludes, { id: uid(), label: "" }]);
  const removePriceInclude = (id: string) => setPriceIncludes(priceIncludes.filter(i => i.id !== id));
  const updatePriceInclude = (id: string, label: string) =>
    setPriceIncludes(priceIncludes.map(i => (i.id === id ? { ...i, label } : i)));

  const addAttraction = () => setSightseeingAttractions([...sightseeingAttractions, { id: uid(), label: "" }]);
  const removeAttraction = (id: string) => setSightseeingAttractions(sightseeingAttractions.filter(i => i.id !== id));
  const updateAttraction = (id: string, label: string) =>
    setSightseeingAttractions(sightseeingAttractions.map(i => (i.id === id ? { ...i, label } : i)));

  const handleSave = () => {
    onSave({
      pageTitle,
      introText,
      transfersDescription,
      priceIncludes: priceIncludes.map(({ label }) => ({ label })),
      sightseeingIntro,
      sightseeingAttractions: sightseeingAttractions.map(({ label }) => ({ label })),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Page Content</DialogTitle>
          <DialogDescription>Update the guest-facing transport page content.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Page Title <span className="text-destructive">*</span></Label>
            <Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Intro Text</Label>
            <Textarea rows={3} value={introText} onChange={e => setIntroText(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Transfers Section Description</Label>
            <Textarea rows={3} value={transfersDescription} onChange={e => setTransfersDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Price Includes</Label>
            {priceIncludes.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <Input className="flex-1" value={item.label} onChange={e => updatePriceInclude(item.id, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removePriceInclude(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={addPriceInclude}>
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Sightseeing Intro Text</Label>
            <Textarea rows={2} value={sightseeingIntro} onChange={e => setSightseeingIntro(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Sightseeing Attractions</Label>
            {sightseeingAttractions.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <Input className="flex-1" value={item.label} onChange={e => updateAttraction(item.id, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeAttraction(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={addAttraction}>
              <Plus className="h-3 w-3 mr-1" /> Add Attraction
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Pricing Tier Modal ──

function PricingTierModal({
  open, onClose, tier, onSave,
}: {
  open: boolean;
  onClose: () => void;
  tier: PricingTier | null;
  onSave: (t: Omit<PricingTier, 'id'>) => void;
}) {
  const [fromNights, setFromNights] = useState(String(tier?.fromNights ?? 1));
  const [toNights, setToNights] = useState(String(tier?.toNights ?? 1));
  const [routeLabel, setRouteLabel] = useState(tier?.routeLabel ?? "");
  const [price, setPrice] = useState(String(tier?.price ?? 0));

  const handleSave = () => {
    onSave({
      fromNights: Number(fromNights) || 1,
      toNights: Number(toNights) || 1,
      routeLabel,
      price: Number(price) || 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tier ? "Edit" : "Add"} Pricing Tier</DialogTitle>
          <DialogDescription>
            Set the days/nights and price. Guests are matched by their exact night count.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Days <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={fromNights} onChange={e => setFromNights(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nights <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={toNights} onChange={e => setToNights(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Guests whose stay matches the Nights count will see this price.
          </p>
          <div className="space-y-1.5">
            <Label>Route Label <span className="text-destructive">*</span></Label>
            <Input value={routeLabel} onChange={e => setRouteLabel(e.target.value)} placeholder="e.g. 3 Nights / 4 Days – Bangalore – Coorg – Bangalore" />
          </div>
          <div className="space-y-1.5">
            <Label>Price (₹) <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{tier ? "Update" : "Add"} Tier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Format date helper ──
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Main Page ──

export default function Transport() {
  const { selectedProperty } = useProperty();
  const PROPERTY_ID = selectedProperty.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();

  const [showContentModal, setShowContentModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TransportBooking | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  // Add Booking dialog state
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBookingId, setNewBookingId] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newCheckIn, setNewCheckIn] = useState<string | null>(null);
  const [newCheckOut, setNewCheckOut] = useState<string | null>(null);
  const [newNights, setNewNights] = useState<number | null>(null);
  const [newAmount, setNewAmount] = useState('');
  const [lookupError, setLookupError] = useState('');

  // ── Queries ──

  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['transport-settings', PROPERTY_ID],
    queryFn: () => dashboardAPI.getTransportSettings(PROPERTY_ID),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['transport-bookings', PROPERTY_ID, filterDate ? format(filterDate, 'yyyy-MM-dd') : null],
    queryFn: () => dashboardAPI.getTransportBookings({
      propertyId: PROPERTY_ID,
      checkInDate: filterDate ? format(filterDate, 'yyyy-MM-dd') : undefined,
    }),
  });

  // ── Mutations ──

  const updateMutation = useMutation({
    mutationFn: (data: any) => dashboardAPI.updateTransportSettings({ propertyId: PROPERTY_ID, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-settings'] });
      toast({ title: "Changes saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => dashboardAPI.cancelTransportBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-bookings'] });
      setCancelTarget(null);
      toast({ title: "Booking cancelled" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    },
  });

  const save = (partial: any) => updateMutation.mutate(partial);

  const addBookingMutation = useMutation({
    mutationFn: (data: { mainStayBookingId: string; amount: number; propertyId: string }) =>
      dashboardAPI.createManualTransportBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-bookings'] });
      toast({ title: "Booking added", description: "Transport booking created successfully." });
      setShowAddBooking(false);
      setNewBookingId(''); setNewGuestName(''); setNewCheckIn(null); setNewCheckOut(null); setNewNights(null); setNewAmount(''); setLookupError('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to create booking", description: err.message, variant: "destructive" });
    },
  });

  const handleBookingIdBlur = async () => {
    const id = newBookingId.trim();
    if (!id) return;
    try {
      const result = await dashboardAPI.getGuestByBookingId(id);
      if (!result) { setLookupError('Booking ID not found. Check and try again.'); return; }
      setLookupError('');
      if (result.primaryGuestName) setNewGuestName(result.primaryGuestName);
      if (result.arrivalDate) setNewCheckIn(result.arrivalDate);
      if (result.checkoutDate) setNewCheckOut(result.checkoutDate);
      if (result.arrivalDate && result.checkoutDate) {
        const nights = Math.max(1, differenceInDays(new Date(result.checkoutDate), new Date(result.arrivalDate)));
        setNewNights(nights);
        const matchingTier = tiers.find(t => nights === t.toNights);
        if (matchingTier) setNewAmount(String(matchingTier.price));
      }
    } catch {
      // silently ignore — user can still fill fields manually
    }
  };

  // Mark transport bookings as seen when staff opens the Bookings tab
  useEffect(() => {
    if (activeTab === 'bookings' && !bookingsLoading && bookings.length > 0) {
      dashboardAPI.markTransportBookingsSeen(PROPERTY_ID).then(() => {
        queryClient.invalidateQueries({ queryKey: ['transport-unseen-count'] });
      }).catch(() => {});
    }
  }, [activeTab, bookingsLoading, bookings.length]);

  // Tier helpers operating on settings.pricingTiers
  const tiers: PricingTier[] = (settings?.pricingTiers || []).map((t: any, idx: number) => ({
    id: t._id || String(idx),
    fromNights: t.fromNights,
    toNights: t.toNights,
    routeLabel: t.routeLabel,
    price: t.price,
  }));

  const handleSaveTier = (tierData: Omit<PricingTier, 'id'>) => {
    const newTiers = editingTierIndex !== null
      ? tiers.map((t, i) => i === editingTierIndex ? { ...t, ...tierData } : t)
      : [...tiers, { id: uid(), ...tierData }];
    save({ pricingTiers: newTiers.map(({ fromNights, toNights, routeLabel, price }) => ({ fromNights, toNights, routeLabel, price })) });
  };

  const handleDeleteTier = (idx: number) => {
    const newTiers = tiers.filter((_, i) => i !== idx);
    save({ pricingTiers: newTiers.map(({ fromNights, toNights, routeLabel, price }) => ({ fromNights, toNights, routeLabel, price })) });
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transport Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage transfer details, pricing, and guest-facing content.</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transport Hub</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-muted-foreground text-sm">Unable to load transport settings. The server may be starting up.</p>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['transport-settings'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Transport Hub</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage transfer details, pricing, and guest-facing content.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Transport Settings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        {/* ── Transport Settings Tab ── */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Visibility */}
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="font-medium">Guest Visibility</Label>
                <Badge variant={settings?.visible ? "default" : "secondary"}>
                  {settings?.visible ? "Visible" : "Hidden"}
                </Badge>
              </div>
              <Switch
                checked={settings?.visible ?? true}
                onCheckedChange={v => save({ visible: v })}
                disabled={updateMutation.isPending}
              />
            </CardContent>
          </Card>

          {/* Page Content Settings */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Page Content Settings</h2>
                {canWrite && (
                  <Button variant="outline" size="sm" onClick={() => setShowContentModal(true)}>
                    <Pencil className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-muted-foreground">Page Title:</span> <span className="text-foreground">{settings?.pageTitle}</span></div>
                <div><span className="font-medium text-muted-foreground">Intro Text:</span> <span className="text-foreground line-clamp-2">{settings?.introText}</span></div>
                <div><span className="font-medium text-muted-foreground">Transfers Description:</span> <span className="text-foreground line-clamp-2">{settings?.transfersDescription}</span></div>
                <div>
                  <span className="font-medium text-muted-foreground">Price Includes:</span>{" "}
                  <span className="text-foreground">{(settings?.priceIncludes || []).map((i: any) => i.label).join(", ")}</span>
                </div>
                <div><span className="font-medium text-muted-foreground">Sightseeing Intro:</span> <span className="text-foreground line-clamp-2">{settings?.sightseeingIntro}</span></div>
                <div>
                  <span className="font-medium text-muted-foreground">Attractions:</span>{" "}
                  <span className="text-foreground">{(settings?.sightseeingAttractions || []).map((i: any) => i.label).join(", ")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Pricing */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-1">
                <h2 className="text-lg font-semibold text-foreground">Transfer Pricing</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Set prices based on guest stay duration. The correct price is shown automatically to each guest based on their check-in and check-out dates.
                </p>
              </div>

              <div className="mt-4 rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Days</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead>Route Label</TableHead>
                      <TableHead className="text-right">Price (₹)</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No pricing tiers configured yet.
                        </TableCell>
                      </TableRow>
                    ) : tiers.map((tier, idx) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">{tier.fromNights}</TableCell>
                        <TableCell className="font-medium">{tier.toNights}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{tier.routeLabel}</TableCell>
                        <TableCell className="text-right font-medium">₹ {tier.price.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setEditingTierIndex(idx); setShowTierModal(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTier(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingTierIndex(null); setShowTierModal(true); }}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add Pricing Tier
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ── Bookings Tab ── */}
        <TabsContent value="bookings" className="mt-6">
          <Card>
            <CardContent className="p-5">
              {/* Filter controls */}
              <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={!filterDate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDate(null)}
                >
                  All
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={filterDate ? "default" : "outline"}
                      size="sm"
                      className={cn(!filterDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-1.5" />
                      {filterDate ? format(filterDate, "dd MMM yyyy") : "Filter by Check-in Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate ?? undefined}
                      onSelect={(d) => setFilterDate(d ?? null)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {filterDate && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setFilterDate(null)}>
                    Clear
                  </Button>
                )}
              </div>
              {canWrite && (
                <Button size="sm" className="gap-1.5" onClick={() => { setShowAddBooking(true); setNewBookingId(''); setNewGuestName(''); setNewCheckIn(null); setNewCheckOut(null); setNewNights(null); setNewAmount(''); setLookupError(''); }}>
                  <Plus className="h-4 w-4" /> Add Booking
                </Button>
              )}
              </div>

              {bookingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {filterDate ? "No bookings for this date." : "No active transport bookings."}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking Ref</TableHead>
                        <TableHead>Guest Name</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead className="text-center">Nights</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking: TransportBooking) => (
                        <TableRow key={booking._id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{booking.bookingId?.bookingId || <span className="text-muted-foreground/40">—</span>}</TableCell>
                          <TableCell className="font-medium">{booking.guestName}</TableCell>
                          <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                          <TableCell className="text-center">{booking.nights}</TableCell>
                          <TableCell className="text-right font-medium">₹ {booking.amount.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right">
                            {booking.status === "confirmed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs"
                                onClick={() => setCancelTarget(booking)}
                              >
                                Cancel
                              </Button>
                            )}
                            {booking.status === "cancelled" && (
                              <Badge variant="secondary" className="text-xs">Cancelled</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      {showContentModal && settings && (
        <PageContentModal
          open={showContentModal}
          onClose={() => setShowContentModal(false)}
          data={settings}
          onSave={partial => save(partial)}
        />
      )}
      {showTierModal && (
        <PricingTierModal
          open={showTierModal}
          onClose={() => { setShowTierModal(false); setEditingTierIndex(null); }}
          tier={editingTierIndex !== null ? tiers[editingTierIndex] : null}
          onSave={handleSaveTier}
        />
      )}

      {/* Add Booking Dialog */}
      <Dialog open={showAddBooking} onOpenChange={v => { if (!v) { setShowAddBooking(false); setNewBookingId(''); setNewGuestName(''); setNewCheckIn(null); setNewCheckOut(null); setNewNights(null); setNewAmount(''); setLookupError(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Transport Booking</DialogTitle>
            <DialogDescription>Enter the main stay booking ID — guest details will auto-fill.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Booking ID */}
            <div className="space-y-1.5">
              <Label>Main Stay Booking ID <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. BK-10234"
                value={newBookingId}
                onChange={e => { setNewBookingId(e.target.value); setLookupError(''); }}
                onBlur={handleBookingIdBlur}
              />
              {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
            </div>

            {/* Guest Name */}
            <div className="space-y-1.5">
              <Label>Guest Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Auto-filled from booking ID"
                value={newGuestName}
                onChange={e => setNewGuestName(e.target.value)}
                maxLength={60}
              />
            </div>

            {/* Auto-filled stay summary */}
            {newCheckIn && newCheckOut && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{format(new Date(newCheckIn), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{format(new Date(newCheckOut), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium">{newNights}</span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>Amount (₹) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={0}
                placeholder="Enter amount"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Auto-filled from matching pricing tier. Adjust if needed.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddBooking(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!newBookingId.trim() || !newGuestName.trim() || !newAmount || addBookingMutation.isPending}
              onClick={() => addBookingMutation.mutate({ mainStayBookingId: newBookingId.trim(), amount: Number(newAmount), propertyId: PROPERTY_ID })}
            >
              {addBookingMutation.isPending ? 'Adding…' : 'Add Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={v => !v && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Transport Booking</DialogTitle>
            <DialogDescription>
              Cancel transport booking for <span className="font-semibold text-foreground">{cancelTarget?.guestName}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Go Back</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget._id)}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
