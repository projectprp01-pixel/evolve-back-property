import { useState, useMemo } from "react";
import { Plus, Search, MoreHorizontal, Edit, Copy, Trash2, CalendarIcon, CalendarDays, Users, IndianRupee, ChevronDown, ChevronLeft, ChevronRight, Info, Link2, ExternalLink, RefreshCw } from "lucide-react";
import { format, addDays, subDays, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ScheduleOffPopover } from "@/components/ui/ScheduleOffPopover";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { dashboardAPI } from "@/services/api";
import type { ActivityBooking } from "@/pages/Activities";
import type { ActivityData } from "@/components/activities/ActivityEditor";

interface ActivityListProps {
  activities: ActivityData[];
  onAddNew?: () => void;
  onAddLinked?: () => void;
  onEdit?: (activity: ActivityData) => void;
  onEditLinked?: (activity: ActivityData) => void;
  onDuplicate?: (activity: ActivityData) => void;
  onDelete?: (activityId: string) => void;
  onToggleActive?: (activityId: string, isActive: boolean) => void;
  onScheduleOff?: (activityId: string, dates: Date[]) => void;
  bookings: ActivityBooking[];
  activeTab: 'activities' | 'bookings';
  onTabChange: (tab: 'activities' | 'bookings') => void;
  onUpdateBookingStatus?: (bookingId: string, status: ActivityBooking['status']) => void;
  onAddBooking?: (data: { experienceId: string; date: string; timeSlot: string; numberOfGuests: number; guestName: string; guestEmail: string; guestPhone: string; adminNotes?: string; mainStayBookingId?: string }) => void;
  isLoading?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  onRefresh?: () => void;
}

function BookingsTab({
  bookings,
  activities,
  onUpdateBookingStatus,
  onAddBooking,
  addBookingOpen,
  onAddBookingOpenChange,
}: {
  bookings: ActivityBooking[];
  activities: ActivityData[];
  onUpdateBookingStatus: (bookingId: string, status: ActivityBooking['status']) => void;
  onAddBooking: ActivityListProps['onAddBooking'];
  addBookingOpen: boolean;
  onAddBookingOpenChange: (open: boolean) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("Active");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState({ guestName: "", activityId: "", date: "", timeSlot: "", guests: "2", mainStayBookingId: "" });
  const [addDatePickerOpen, setAddDatePickerOpen] = useState(false);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const filtered = useMemo(() => {
    let list = selectedDateStr ? bookings.filter((b) => b.date === selectedDateStr) : bookings;
    if (selectedActivity !== "all") list = list.filter((b) => b.activityId === selectedActivity);
    if (selectedStatus === "Active") list = list.filter((b) => b.status !== "Cancelled");
    else if (selectedStatus === "Cancelled") list = list.filter((b) => b.status === "Cancelled");
    return list.sort((a, b) => {
      if (a.status === "Cancelled" && b.status !== "Cancelled") return 1;
      if (a.status !== "Cancelled" && b.status === "Cancelled") return -1;
      return b.date.localeCompare(a.date); // newest first
    });
  }, [bookings, selectedDateStr, selectedActivity, selectedStatus]);

  const activeCount = bookings.filter(b => (!selectedDateStr || b.date === selectedDateStr) && b.status !== "Cancelled").length;

  const handleCancelBooking = (bookingId: string) => {
    onUpdateBookingStatus(bookingId, "Cancelled");
    setCancelConfirmId(null);
  };

  // Get selected activity for add modal
  const selectedActivityData = activities.find(a => a.id === newBooking.activityId);

  // Get available time slots for the selected activity
  const availableTimeSlots = selectedActivityData?.times ?? [];

  // Determine if guest count is fixed
  const isFixedGroup = selectedActivityData && !selectedActivityData.guestCanChooseGroupSize;

  const handleAddBooking = () => {
    if (!newBooking.guestName || !newBooking.activityId || !newBooking.date || !newBooking.timeSlot) return;
    onAddBooking({
      experienceId: newBooking.activityId,
      date: newBooking.date,
      timeSlot: newBooking.timeSlot,
      numberOfGuests: parseInt(newBooking.guests) || 1,
      guestName: newBooking.guestName,
      guestEmail: "",
      guestPhone: "",
      mainStayBookingId: newBooking.mainStayBookingId.trim() || undefined,
    });
    setNewBooking({ guestName: "", activityId: "", date: "", timeSlot: "", guests: "2", mainStayBookingId: "" });
    onAddBookingOpenChange(false);
  };

  // Disabled dates for add modal calendar
  const getDisabledDates = (activity: ActivityData | undefined) => {
    if (!activity) return undefined;
    return (date: Date) => {
      if (isBefore(date, startOfDay(new Date()))) return true;
      // Check day-of-week config
      const dayIndex = (date.getDay() + 6) % 7; // Mon=0
      if (!activity.days[dayIndex]) return true;
      // Check blocked dates
      if (activity.blackoutDates?.length) {
        const dateStr = format(date, "yyyy-MM-dd");
        if (activity.blackoutDates.some(d => format(new Date(d), "yyyy-MM-dd") === dateStr)) return true;
      }
      return false;
    };
  };

  const publishedActivities = activities.filter(a => a.status === 'Published' && a.isActive);

  return (
    <div className="space-y-4">
      {/* Date Picker Row */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDate(prev => subDays(prev ?? new Date(), 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-center font-medium">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {selectedDate ? format(selectedDate, "EEE, dd MMM yyyy") : "All Dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ?? undefined}
                  onSelect={(d) => { setSelectedDate(d ?? null); setDatePickerOpen(false); }}
                  className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDate(prev => addDays(prev ?? new Date(), 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedDate(null)}>
              All Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Row */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* All Activities */}
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                {publishedActivities.map((a) => (
                  <SelectItem key={a.id} value={a.id!}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active / Cancelled */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="text-xs">
              {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">
                {selectedDate ? `No bookings for ${format(selectedDate, "EEE, dd MMM yyyy")}` : "No bookings found"}
              </p>
              <p className="text-sm mt-1">Try selecting a different date or adjusting filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-700">Booking Ref</TableHead>
                  <TableHead className="font-semibold text-gray-700">Guest</TableHead>
                  <TableHead className="font-semibold text-gray-700">Activity</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Time</TableHead>
                  <TableHead className="font-semibold text-gray-700">Guests</TableHead>
                  <TableHead className="font-semibold text-gray-700">Price</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Cancel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const isCancelled = booking.status === "Cancelled";
                  return (
                    <TableRow key={booking.id} className={cn("hover:bg-gray-50/50", isCancelled && "opacity-50")}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{booking.mainStayBookingId || <span className="text-muted-foreground/40">—</span>}</TableCell>
                      <TableCell className="font-medium text-gray-900">{booking.guestName}</TableCell>
                      <TableCell className="text-gray-700">{booking.activityTitle}</TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(booking.date + 'T00:00:00'), "EEE, MMM d")}
                      </TableCell>
                      <TableCell className="text-gray-600">{booking.time || "—"}</TableCell>
                      <TableCell className="text-gray-600">{booking.adults + booking.children}</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {booking.totalAmount > 0
                          ? `₹${booking.totalAmount.toLocaleString('en-IN')}`
                          : <span className="text-green-700 text-xs font-medium">Complimentary</span>
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {isCancelled ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
                            Cancelled
                          </Badge>
                        ) : (
                          <button
                            onClick={() => setCancelConfirmId(booking.id)}
                            className="text-sm text-red-500/70 hover:text-red-600 font-medium">
                            Cancel
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>This action cannot be undone. The booking will be marked as cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelConfirmId(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={() => cancelConfirmId && handleCancelBooking(cancelConfirmId)}>
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booking Modal */}
      <Dialog open={addBookingOpen} onOpenChange={onAddBookingOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
            <DialogDescription>Add a booking on behalf of a guest (walk-in, phone, or staff request)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Booking ID */}
            <div>
              <Label className="text-sm font-medium">Booking ID (optional)</Label>
              <Input
                value={newBooking.mainStayBookingId}
                onChange={(e) => setNewBooking(p => ({ ...p, mainStayBookingId: e.target.value }))}
                onBlur={async () => {
                  const id = newBooking.mainStayBookingId.trim();
                  if (!id) return;
                  try {
                    const result = await dashboardAPI.getGuestByBookingId(id);
                    if (result?.primaryGuestName) setNewBooking(p => ({ ...p, guestName: result.primaryGuestName }));
                  } catch { /* ignore */ }
                }}
                placeholder="e.g. BK-10234 — auto-fills guest name" />
            </div>
            {/* Guest Name */}
            <div>
              <Label className="text-sm font-medium">Guest Name <span className="text-destructive">*</span></Label>
              <Input
                value={newBooking.guestName}
                onChange={(e) => setNewBooking(p => ({ ...p, guestName: e.target.value.slice(0, 60) }))}
                placeholder="e.g., Ananya Mehta" />
            </div>

            {/* Activity */}
            <div>
              <Label className="text-sm font-medium">Activity <span className="text-destructive">*</span></Label>
              <Select value={newBooking.activityId} onValueChange={(v) => setNewBooking(p => ({ ...p, activityId: v, date: "", timeSlot: "", guests: "2", mainStayBookingId: p.mainStayBookingId }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {publishedActivities.length === 0 ? (
                    <SelectItem value="none" disabled>No active activities</SelectItem>
                  ) : publishedActivities.map((a) => (
                    <SelectItem key={a.id} value={a.id!}>{a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            {newBooking.activityId && (
              <div>
                <Label className="text-sm font-medium">Date <span className="text-destructive">*</span></Label>
                <Popover open={addDatePickerOpen} onOpenChange={setAddDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {newBooking.date ? format(new Date(newBooking.date + 'T00:00:00'), "EEE, dd MMM yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newBooking.date ? new Date(newBooking.date + 'T00:00:00') : undefined}
                      onSelect={(d) => {
                        if (d) {
                          setNewBooking(p => ({ ...p, date: format(d, "yyyy-MM-dd") }));
                          setAddDatePickerOpen(false);
                        }
                      }}
                      disabled={getDisabledDates(selectedActivityData)}
                      className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Time Slot */}
            {newBooking.date && availableTimeSlots.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Time Slot <span className="text-destructive">*</span></Label>
                <Select value={newBooking.timeSlot} onValueChange={(v) => setNewBooking(p => ({ ...p, timeSlot: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((t) => {
                      const label = selectedActivityData?.timeSlotLabels?.[t];
                      return (
                        <SelectItem key={t} value={t}>
                          {label ? `${label} — ${t}` : t}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Number of Guests */}
            {newBooking.activityId && (
              <div>
                <Label className="text-sm font-medium">Number of Guests <span className="text-destructive">*</span></Label>
                {isFixedGroup ? (
                  <>
                    <Input
                      type="number"
                      value={selectedActivityData?.groupSizeMin ?? 2}
                      disabled
                      className="bg-gray-50 text-gray-500" />
                    <p className="text-xs text-muted-foreground mt-1">Set by activity configuration.</p>
                  </>
                ) : (
                  <Input
                    type="number"
                    value={newBooking.guests}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                      setNewBooking(p => ({ ...p, guests: String(val) }));
                    }}
                    min={selectedActivityData?.groupSizeMin ?? 1}
                    max={selectedActivityData?.groupSizeMax ?? 20} />
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onAddBookingOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleAddBooking}
              disabled={!newBooking.guestName || !newBooking.activityId || !newBooking.date || !newBooking.timeSlot}
              className="bg-[hsl(var(--amber))] hover:bg-[hsl(var(--amber))]/90">
              Add Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ActivityList({
  activities,
  onAddNew,
  onAddLinked,
  onEdit,
  onEditLinked,
  onDuplicate,
  onDelete,
  onToggleActive,
  onScheduleOff,
  bookings,
  activeTab,
  onTabChange,
  onUpdateBookingStatus,
  onAddBooking,
  isLoading,
  isUpdating,
  isDeleting,
  onRefresh,
}: ActivityListProps) {
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'On-site': return 'bg-green-100 text-green-800';
      case 'Nearby': return 'bg-blue-100 text-blue-800';
      case 'Facilities': return 'bg-purple-100 text-purple-800';
      case 'Wellness & Recreation': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Published': return 'default' as const;
      case 'Draft': return 'secondary' as const;
      default: return 'secondary' as const;
    }
  };

  const busy = isLoading || isUpdating || isDeleting;
  const busyLabel = isLoading ? "Loading experiences…" : isUpdating ? "Saving changes…" : isDeleting ? "Deleting…" : "";

  return (
    <div className="space-y-6">
      <LoadingBar loading={busy} label={busyLabel} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Experience Hub</h1>
          <p className="text-muted-foreground">Manage your property's activities and experiences</p>
        </div>
        {activeTab === 'activities' && (
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          {onAddNew && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[hsl(var(--amber))] hover:bg-[hsl(var(--amber))]/90 gap-2">
                  <Plus className="w-4 h-4" />
                  Add New
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddNew}>
                  <Plus className="w-4 h-4 mr-2" /> Create New Activity
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Link2 className="w-4 h-4 mr-2" /> Link Existing Listing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
        )}
        {activeTab === 'bookings' && onAddBooking && (
          <Button onClick={() => setAddBookingOpen(true)} className="bg-[hsl(var(--amber))] hover:bg-[hsl(var(--amber))]/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Booking
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'activities' | 'bookings')}>
        <TabsList className="grid grid-cols-2 w-72">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings
            {bookings.filter(b => b.status !== 'Cancelled').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold w-5 h-5">
                {bookings.filter(b => b.status !== 'Cancelled').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div>
        {activeTab === 'activities' && (
          <>
            {/* Add-Ons Info Card */}
            <div className="flex items-start gap-3 p-4 mb-6 bg-blue-50/60 border border-blue-200/40 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Published activities automatically appear in the guest app's Add-Ons tab under 'Experiences'. Items from other sections (Dining, Spa, Transfers) are managed in their respective hubs.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  className="pl-10"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-4">
              {activities.filter(a => !activitySearch || a.title.toLowerCase().includes(activitySearch.toLowerCase())).map((activity) => {
                const isLinked = activity.type === 'linked';
                return (
                <Card key={activity.id} className="shadow-soft hover:shadow-lg transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {activity.primaryImage ? (
                          <img src={activity.primaryImage} alt={activity.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                        )}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-lg leading-tight">{activity.title}</h3>
                              {isLinked ? (
                                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  <Link2 className="w-3 h-3 mr-1" /> Linked
                                </Badge>
                              ) : (
                                <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {activity.categories.map((category) => (
                                <Badge key={category} className={`text-xs ${getCategoryColor(category)}`}>
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {!isLinked && onToggleActive && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {activity.isActive ? 'On' : 'Off'}
                                </span>
                                <Switch
                                  checked={activity.isActive}
                                  onCheckedChange={(checked) => onToggleActive(activity.id!, checked)} />
                                {onScheduleOff && (
                                  <ScheduleOffPopover
                                    blackoutDates={activity.blackoutDates || []}
                                    onDatesChange={(dates) => onScheduleOff!(activity.id!, dates)} />
                                )}
                              </>
                            )}
                            {(onEdit || onEditLinked || onDelete || onDuplicate) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(onEdit || onEditLinked) && (
                                    <DropdownMenuItem onClick={() => isLinked ? onEditLinked?.(activity) : onEdit?.(activity)}>
                                      <Edit className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  {!isLinked && onDuplicate && (
                                    <DropdownMenuItem onClick={() => onDuplicate(activity)}>
                                      <Copy className="w-4 h-4 mr-2" /> Duplicate
                                    </DropdownMenuItem>
                                  )}
                                  {onDelete && (
                                    <DropdownMenuItem onClick={() => onDelete(activity.id!)} className="text-destructive">
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {isLinked ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Redirects to: <span className="font-medium text-foreground">{activity.redirectPath}</span></span>
                            <span className="mx-1">·</span>
                            <span>CTA: "{activity.ctaLabel || 'Book Now'}"</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {activity.summary}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {activity.categories[0] && (
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.categories[0]}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {activity.durationDisplayText || `${activity.durationMin}–${activity.durationMax} mins`}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {activity.groupSizeMin}–{activity.groupSizeMax} guests
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {activity.times.length} time slot{activity.times.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium text-foreground ml-4">
                                {activity.adultPrice > 0
                                  ? `From ${activity.currency} ${activity.adultPrice}${activity.pricingModel === 'Per person' ? '/person' : '/group'}`
                                  : <span className="text-green-700 text-xs font-medium">Complimentary</span>
                                }
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {activities.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
                <p className="text-muted-foreground mb-4">Create your first activity to get started</p>
                {onAddNew && (
                  <Button onClick={onAddNew} className="bg-[hsl(var(--amber))] hover:bg-[hsl(var(--amber))]/90">
                    Create First Activity
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <BookingsTab
            bookings={bookings}
            activities={activities}
            onUpdateBookingStatus={onUpdateBookingStatus}
            onAddBooking={onAddBooking}
            addBookingOpen={addBookingOpen}
            onAddBookingOpenChange={setAddBookingOpen} />
        )}
      </div>
    </div>
  );
}
