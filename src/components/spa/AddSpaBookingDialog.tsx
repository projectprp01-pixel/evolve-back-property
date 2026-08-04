import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SpaTreatmentData, SpaTimeSlot } from "./AddSpaTreatmentDialog";
import type { SpaBookingAPI } from "@/services/api";
import { dashboardAPI } from "@/services/api";

function NumericInput({ value, onChangeValue, min = 0, max, className }: { value: number; onChangeValue: (v: number) => void; min?: number; max?: number; className?: string }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  return (
    <Input
      type="text" inputMode="numeric" className={className} value={raw}
      onChange={e => {
        const n = e.target.value.replace(/[^0-9]/g, "");
        setRaw(n);
        if (n !== "") {
          let v = Number(n);
          if (max !== undefined && v > max) v = max;
          onChangeValue(v);
        }
      }}
      onBlur={() => { if (raw === "") { setRaw(String(min)); onChangeValue(min); } }}
    />
  );
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  treatments: SpaTreatmentData[];
  onSave: (data: { guestName: string; treatmentId: string; treatmentName: string; date: string; timeSlot: string; numberOfGuests: number; price: number; mainStayBookingId?: string }) => void;
  isPending?: boolean;
  allBookings: SpaBookingAPI[];
  therapistCount: number;
}

export function AddSpaBookingDialog({ open, onOpenChange, treatments, onSave, isPending, allBookings, therapistCount }: Props) {
  const [guestName, setGuestName] = useState("");
  const [mainStayBookingId, setMainStayBookingId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState("");
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    if (open) {
      setGuestName(""); setMainStayBookingId(""); setTreatmentId(""); setDate(new Date()); setTimeSlot(""); setGuests(1);
    }
  }, [open]);

  const handleBookingIdBlur = async () => {
    const id = mainStayBookingId.trim();
    if (!id) return;
    try {
      const result = await dashboardAPI.getGuestByBookingId(id);
      if (result?.primaryGuestName) setGuestName(result.primaryGuestName);
    } catch {
      // ignore lookup failure
    }
  };

  const activeTreatments = treatments.filter(t => t.isActive);
  const selectedTreatment = activeTreatments.find(t => t.id === treatmentId);

  const blockedDateStrings = useMemo(() => {
    if (!selectedTreatment) return new Set<string>();
    return new Set(selectedTreatment.blockedDates.map(d => d.toDateString()));
  }, [selectedTreatment]);

  const availableSlots = selectedTreatment?.timeSlots ?? [];

  // Build a map of timeSlot → booking count for selected date (active bookings only, across ALL treatments)
  const bookedSlotCounts = useMemo(() => {
    if (!date) return new Map<string, number>();
    const dateStr = format(date, "yyyy-MM-dd");
    const counts = new Map<string, number>();
    for (const b of allBookings) {
      if (b.status === "Cancelled") continue;
      const bDateStr = new Date(b.date).toISOString().split("T")[0];
      if (bDateStr === dateStr && b.timeSlot) {
        counts.set(b.timeSlot, (counts.get(b.timeSlot) || 0) + 1);
      }
    }
    return counts;
  }, [allBookings, date]);

  // Reset time slot when treatment changes
  useEffect(() => { setTimeSlot(""); }, [treatmentId]);
  // Clamp guests to max
  useEffect(() => {
    if (selectedTreatment && guests > selectedTreatment.guestCapacityMax) {
      setGuests(selectedTreatment.guestCapacityMax);
    }
  }, [selectedTreatment, guests]);

  const formatSlotTime = (s: SpaTimeSlot) => {
    const h = parseInt(s.hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${s.label ? s.label + " — " : ""}${h12}:${s.minute} ${ampm}`;
  };

  const isValid = guestName.trim() && treatmentId && date && (availableSlots.length === 0 || timeSlot);

  const handleSave = () => {
    if (!selectedTreatment || !date) return;
    const slot = availableSlots.find(s => s.id === timeSlot);
    onSave({
      guestName,
      treatmentId: selectedTreatment.id,
      treatmentName: selectedTreatment.name,
      date: format(date, "yyyy-MM-dd"),
      timeSlot: slot ? formatSlotTime(slot) : "Full day",
      numberOfGuests: guests,
      price: selectedTreatment.price * guests,
      mainStayBookingId: mainStayBookingId.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
          <DialogDescription>Add a spa booking on behalf of a guest</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Booking ID (optional)</Label>
            <Input value={mainStayBookingId} onChange={e => setMainStayBookingId(e.target.value)} onBlur={handleBookingIdBlur} placeholder="e.g. BK-10234 — auto-fills guest name" />
          </div>
          <div className="space-y-2">
            <Label>Guest Name <span className="text-destructive">*</span></Label>
            <Input value={guestName} maxLength={60} onChange={e => setGuestName(e.target.value)} placeholder="Enter guest name" />
          </div>

          <div className="space-y-2">
            <Label>Treatment <span className="text-destructive">*</span></Label>
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger><SelectValue placeholder="Select treatment" /></SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {activeTreatments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single" selected={date} onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().toDateString()) || blockedDateStrings.has(d.toDateString())}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label>Time Slot <span className="text-destructive">*</span></Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {availableSlots.map(s => {
                    const slotLabel = formatSlotTime(s);
                    const count = bookedSlotCounts.get(slotLabel) || 0;
                    const isFull = count >= therapistCount;
                    return (
                      <SelectItem key={s.id} value={s.id} disabled={isFull}>
                        {slotLabel}{isFull ? " (Full)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTreatment && (
            <div className="space-y-2">
              <Label>Number of Guests</Label>
              <NumericInput
                value={guests}
                onChangeValue={setGuests}
                min={1}
                max={selectedTreatment.guestCapacityMax}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Up to {selectedTreatment.guestCapacityMax} guests per session
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || isPending}>
              {isPending ? "Adding..." : "Add Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
