import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X, Plus, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface SpaTimeSlot {
  id: string;
  label: string;
  hour: string;
  minute: string;
}

export interface SpaTreatmentData {
  id: string;
  image?: string;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  guestCapacityMax: number;
  durationDisplay: string;
  price: number;
  pricingLabel: string;
  timeSlots: SpaTimeSlot[];
  blockedDates: Date[];
  isActive: boolean;
}

const LIMITS = { name: 40, subtitle: 80, description: 300, durationDisplay: 40, pricingLabel: 50, slotLabel: 30 } as const;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function NumericInput({ value, onChangeValue, min = 0, className, placeholder }: { value: number; onChangeValue: (v: number) => void; min?: number; className?: string; placeholder?: string }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  return (
    <Input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={raw}
      onChange={e => { const n = e.target.value.replace(/[^0-9]/g, ""); setRaw(n); if (n !== "") onChangeValue(Number(n)); }}
      onBlur={() => { if (raw === "") { setRaw(String(min)); onChangeValue(min); } }}
    />
  );
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  treatment?: SpaTreatmentData | null;
  categories: string[];
  onSave: (t: SpaTreatmentData) => void;
  isPending?: boolean;
}

const emptyTreatment = (): SpaTreatmentData => ({
  id: `treatment_${Date.now()}`,
  name: "",
  subtitle: "",
  category: "",
  description: "",
  guestCapacityMax: 2,
  durationDisplay: "",
  price: 0,
  pricingLabel: "Per person",
  timeSlots: [
    { id: "default-1", label: "Morning", hour: "09", minute: "00" },
    { id: "default-2", label: "Late Morning", hour: "10", minute: "15" },
    { id: "default-3", label: "Midday", hour: "11", minute: "30" },
    { id: "default-4", label: "Afternoon", hour: "14", minute: "00" },
    { id: "default-5", label: "Late Afternoon", hour: "15", minute: "15" },
  ],
  blockedDates: [],
  isActive: true,
});

export function AddSpaTreatmentDialog({ open, onOpenChange, treatment, categories, onSave, isPending = false }: Props) {
  const [form, setForm] = useState<SpaTreatmentData>(emptyTreatment());

  useEffect(() => {
    if (treatment) {
      setForm(treatment);
    } else {
      setForm(emptyTreatment());
    }
  }, [treatment, open]);

  const update = <K extends keyof SpaTreatmentData>(k: K, v: SpaTreatmentData[K]) => setForm(p => ({ ...p, [k]: v }));

  const addSlot = () => update("timeSlots", [...form.timeSlots, { id: `slot_${Date.now()}`, label: "", hour: "09", minute: "00" }]);
  const removeSlot = (id: string) => update("timeSlots", form.timeSlots.filter(s => s.id !== id));
  const updateSlot = (id: string, field: keyof SpaTimeSlot, val: string) =>
    update("timeSlots", form.timeSlots.map(s => s.id === id ? { ...s, [field]: val } : s));

  const addBlockedDate = (date: Date | undefined) => {
    if (!date) return;
    if (form.blockedDates.some(d => d.toDateString() === date.toDateString())) return;
    update("blockedDates", [...form.blockedDates, date]);
  };
  const removeBlockedDate = (idx: number) => update("blockedDates", form.blockedDates.filter((_, i) => i !== idx));

  const isValid =
    form.name.trim() &&
    form.category &&
    form.description.trim() &&
    form.durationDisplay.trim() &&
    form.price > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{treatment ? "Edit Treatment" : "Add Treatment"}</DialogTitle>
          <DialogDescription>Configure a spa treatment that guests can view and book</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 1. Treatment Name */}
          <div className="space-y-2">
            <Label>Treatment Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} maxLength={LIMITS.name} onChange={e => update("name", e.target.value)} placeholder="e.g., Abhyanga" />
            <p className="text-xs text-muted-foreground text-right">{form.name.length}/{LIMITS.name}</p>
          </div>

          {/* 4. Category */}
          <div className="space-y-2">
            <Label>Category <span className="text-destructive">*</span></Label>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No categories — add one in the Treatments tab first</p>
            ) : (
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 5. Description */}
          <div className="space-y-2">
            <Label>Description <span className="text-destructive">*</span></Label>
            <Textarea value={form.description} maxLength={LIMITS.description} onChange={e => update("description", e.target.value)} placeholder="Describe the treatment in detail..." rows={4} />
            <p className="text-xs text-muted-foreground">Detailed description shown to guests on the treatment page</p>
            <p className="text-xs text-muted-foreground text-right">{form.description.length}/{LIMITS.description}</p>
          </div>

          {/* 6. Guest Capacity */}
          <div className="space-y-2">
            <Label>Max Guests per Treatment</Label>
            <NumericInput value={form.guestCapacityMax} onChangeValue={v => update("guestCapacityMax", v)} min={1} />
            <p className="text-xs text-muted-foreground">Maximum number of guests allowed per session</p>
          </div>

          {/* 7. Duration Display */}
          <div className="space-y-2">
            <Label>Duration Display <span className="text-destructive">*</span></Label>
            <Input value={form.durationDisplay} maxLength={LIMITS.durationDisplay} onChange={e => update("durationDisplay", e.target.value)} placeholder="e.g., 1 Hour 15 Minutes, 30 Minutes" />
            <p className="text-xs text-muted-foreground">Shown in the pricing card and treatment listing</p>
            <p className="text-xs text-muted-foreground text-right">{form.durationDisplay.length}/{LIMITS.durationDisplay}</p>
          </div>

          {/* 8. Price */}
          <div className="space-y-2">
            <Label>Price (₹) <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">₹</span>
              <NumericInput value={form.price} onChangeValue={v => update("price", v)} placeholder="0" />
            </div>
          </div>

          {/* 9. Pricing Label */}
          <div className="space-y-2">
            <Label>Pricing Label</Label>
            <Input value={form.pricingLabel} maxLength={LIMITS.pricingLabel} onChange={e => update("pricingLabel", e.target.value)} placeholder="e.g., Per person, Per couple" />
            <p className="text-xs text-muted-foreground">Label shown above the price in the guest app</p>
            <p className="text-xs text-muted-foreground text-right">{form.pricingLabel.length}/{LIMITS.pricingLabel}</p>
          </div>

          {/* 10. Time Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Time Slots</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                <Plus className="h-3 w-3 mr-1" /> Add time slot
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Time slots shown to guests when booking. Only the start time is shown (e.g., "Morning — 9:00 AM")</p>

            {form.timeSlots.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-2">No time slots — guests will select a date only</p>
            )}

            {form.timeSlots.map(slot => (
              <div key={slot.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                <Input
                  value={slot.label}
                  maxLength={LIMITS.slotLabel}
                  onChange={e => updateSlot(slot.id, "label", e.target.value)}
                  placeholder="e.g., Morning"
                  className="flex-1"
                />
                <Select value={slot.hour} onValueChange={v => updateSlot(slot.id, "hour", v)}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-48">
                    {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select value={slot.minute} onValueChange={v => updateSlot(slot.id, "minute", v)}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeSlot(slot.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 11. Blocked Dates */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label>Blocked Dates</Label>
            </div>
            <p className="text-xs text-muted-foreground">Block specific dates when this treatment is unavailable</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Add blocked date</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  onSelect={addBlockedDate}
                  disabled={(d) => d < new Date(new Date().toDateString())}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {form.blockedDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.blockedDates.map((d, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {format(d, "EEE, MMM d")}
                    <button onClick={() => removeBlockedDate(i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 12. Active Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
            <div>
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">Inactive treatments are hidden from the guest app</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={v => update("isActive", v)} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onSave(form); onOpenChange(false); }} disabled={!isValid || categories.length === 0 || isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "Saving…" : treatment ? "Update" : "Add Treatment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
