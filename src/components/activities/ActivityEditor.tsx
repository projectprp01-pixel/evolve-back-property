import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, Plus, X, Info, CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface TimeSlotEntry {
  id: string;
  label: string;
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
}

export interface ActivityData {
  id?: string;
  type?: 'full' | 'linked';
  ctaLabel?: string;
  redirectPath?: string;
  title: string;
  subtitle: string;
  description: string;
  primaryImage: string;
  isActive: boolean;
  groupSizeMin: number;
  groupSizeMax: number;
  capacityUnit: string;
  guestCanChooseGroupSize: boolean;
  propertyScheduled: boolean;
  days: boolean[];
  timeSlots: TimeSlotEntry[];
  cutoff: number;
  blackoutDates: Date[];
  slotsPerSession: number;
  bookingsPerDay: number;
  complimentary: boolean;
  pricingModel: 'Per person' | 'Per group';
  currency: string;
  adultPrice: number;
  pricingLabel: string;
  durationDisplayText: string;
  peopleAccommodatedMin: number;
  peopleAccommodatedMax: number;
  status: 'Draft' | 'Published';
  // Legacy fields kept for mapping compatibility
  summary: string;
  overview: string;
  noteDisclaimer: string;
  categories: string[];
  durationMin: number;
  durationMax: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  meetingPoint: string;
  imageAlt: string;
  included: string[];
  excluded: string[];
  times: string[];
  timeSlotLabels: Record<string, string>;
  buffer: number;
  taxInclusive: boolean;
  childPrice: number;
  childAgeRange: string;
  guestNote: string;
}

export const initialActivityData: ActivityData = {
  title: "",
  subtitle: "",
  description: "",
  primaryImage: "",
  isActive: true,
  groupSizeMin: 2,
  groupSizeMax: 8,
  capacityUnit: "guests",
  guestCanChooseGroupSize: true,
  propertyScheduled: false,
  days: [false, true, true, true, true, true, true],
  timeSlots: [
    { id: '1', label: 'Morning Walk', startHour: '07', startMin: '00', endHour: '08', endMin: '30' },
    { id: '2', label: 'Evening Walk', startHour: '16', startMin: '00', endHour: '17', endMin: '30' },
  ],
  cutoff: 120,
  blackoutDates: [],
  slotsPerSession: 8,
  bookingsPerDay: 16,
  complimentary: false,
  pricingModel: 'Per person',
  currency: 'INR',
  adultPrice: 1200,
  pricingLabel: "per person (incl. taxes)",
  durationDisplayText: "1.5 hours",
  peopleAccommodatedMin: 2,
  peopleAccommodatedMax: 8,
  status: 'Draft',
  // Legacy defaults
  summary: "Explore the aromatic spice gardens of Thekkady",
  overview: "A guided walk through our organic spice plantation with fresh spice tea.",
  noteDisclaimer: "Wear comfortable walking shoes. Not recommended during heavy rain.",
  categories: [],
  durationMin: 90,
  durationMax: 90,
  difficulty: 'Easy',
  meetingPoint: "Resort Lobby",
  imageAlt: "Guided Spice Plantation Walk",
  included: ['Expert naturalist guide', 'Fresh spice tea', 'Spice samples'],
  excluded: ['Personal purchases', 'Gratuities'],
  times: ['07:00', '16:00'],
  timeSlotLabels: { '07:00': 'Morning Walk', '16:00': 'Evening Walk' },
  buffer: 15,
  taxInclusive: true,
  childPrice: 600,
  childAgeRange: "",
  guestNote: "",
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


function NumericInput({
  value,
  onChangeValue,
  min = 0,
  className,
}: {
  value: number;
  onChangeValue: (value: number) => void;
  min?: number;
  className?: string;
}) {
  const [raw, setRaw] = useState<string>(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={raw}
      className={className}
      onChange={(e) => {
        const next = e.target.value.replace(/[^0-9]/g, "");
        setRaw(next);
        if (next !== "") {
          onChangeValue(Number(next));
        }
      }}
      onBlur={() => {
        if (raw === "") {
          setRaw(String(min));
          onChangeValue(min);
          return;
        }
        const parsed = Math.max(min, Number(raw));
        setRaw(String(parsed));
        onChangeValue(parsed);
      }}
    />
  );
}

interface ActivityEditorProps {
  activityData?: ActivityData;
  onBack: () => void;
  onSave: (data: ActivityData) => void;
  isSaving?: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function ActivityEditor({ activityData, onBack, onSave, isSaving = false }: ActivityEditorProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ActivityData>(activityData || initialActivityData);
  const [showUndo, setShowUndo] = useState(false);
  const [prevData, setPrevData] = useState<ActivityData>(activityData || initialActivityData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showCoachMarks, setShowCoachMarks] = useState(!activityData);
  const [blockedDatePickerOpen, setBlockedDatePickerOpen] = useState(false);
  const [publishAttempted, setPublishAttempted] = useState(false);

  useEffect(() => {
    const errors: string[] = [];
    if (!data.title.trim()) errors.push('Title is required');
    if (!data.subtitle.trim()) errors.push('Subtitle is required');
    if (!data.description.trim()) errors.push('Description is required');
    setValidationErrors(errors);
  }, [data]);

  const isValid = validationErrors.length === 0;

  const updateData = (field: keyof ActivityData, value: any) => {
    setPrevData(data);
    setData((prev) => ({ ...prev, [field]: value }));
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 5000);
  };

  const undo = () => {
    setData(prevData);
    setShowUndo(false);
  };

  const toggleDay = (index: number) => {
    const newDays = [...data.days];
    newDays[index] = !newDays[index];
    updateData('days', newDays);
  };

  const addBlockedDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const alreadyBlocked = data.blackoutDates.some(d => format(new Date(d), "yyyy-MM-dd") === dateStr);
    if (!alreadyBlocked) {
      updateData('blackoutDates', [...data.blackoutDates, date]);
    }
  };

  const removeBlockedDate = (index: number) => {
    updateData('blackoutDates', data.blackoutDates.filter((_, i) => i !== index));
  };

  // Time slot management
  const getLabelForHour = (hour: string): string => {
    const h = parseInt(hour, 10);
    if (h >= 6 && h <= 9) return "Morning";
    if (h >= 10 && h <= 11) return "Late Morning";
    if (h >= 12 && h <= 13) return "Midday";
    if (h >= 14 && h <= 15) return "Afternoon";
    if (h >= 16 && h <= 17) return "Late Afternoon";
    return "Evening";
  };

  const addTimeSlot = () => {
    const startHour = "09";
    const newSlot: TimeSlotEntry = {
      id: generateId(),
      label: getLabelForHour(startHour),
      startHour,
      startMin: "00",
      endHour: "10",
      endMin: "00",
    };
    updateData('timeSlots', [...data.timeSlots, newSlot]);
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlotEntry, value: string) => {
    updateData('timeSlots', data.timeSlots.map(ts =>
      ts.id === id ? { ...ts, [field]: value } : ts
    ));
  };

  const removeTimeSlot = (id: string) => {
    updateData('timeSlots', data.timeSlots.filter(ts => ts.id !== id));
  };

  // Add-on management

  const renderField = (label: string, required = false, help?: string) => (
    <div className="flex items-center gap-2 mb-1">
      <Label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {help && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">{help}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  const handleSave = (status: 'Draft' | 'Published') => {
    if (status === 'Published' && !isValid) {
      setPublishAttempted(true);
      // Scroll to first invalid field
      const firstError = document.querySelector('[data-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Sync legacy fields for backend mapping
    const updatedData: ActivityData = {
      ...data,
      status,
      shortDescription: data.subtitle,
      overview: data.description,
      times: data.timeSlots.map(ts => `${ts.startHour}:${ts.startMin}`),
      timeSlotLabels: Object.fromEntries(
        data.timeSlots.filter(ts => ts.label).map(ts => [`${ts.startHour}:${ts.startMin}`, ts.label])
      ),
    };
    setData(updatedData);
    onSave(updatedData);
    toast({
      title: status === 'Published' ? 'Activity Published' : 'Draft Saved',
      description: `${data.title || 'Activity'} has been ${status.toLowerCase()}.`
    });
  };

  const sectionCard = "bg-card rounded-xl p-6 shadow-sm border border-border";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
                Activities
              </Button>
              <div className="flex items-center gap-3">
                <Input
                  value={data.title}
                  onChange={(e) => updateData('title', e.target.value)}
                  className="text-lg font-serif border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0"
                  placeholder="Activity Title" />
                <Badge variant={data.status === 'Published' ? 'default' : 'secondary'}>
                  {data.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Marks */}
      {showCoachMarks && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-xl max-w-md">
            <h3 className="font-semibold mb-2 text-foreground">Welcome to Activity Editor!</h3>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>1. Fill Basic Info first</li>
              <li>2. Set up Scheduling</li>
              <li>3. Configure Pricing & Add-Ons</li>
            </ul>
            <Button onClick={() => setShowCoachMarks(false)} className="w-full">
              Got it!
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6 pb-8">

          {/* ═══════════════════ SECTION 1: BASIC INFO ═══════════════════ */}
          <div className={sectionCard}>
            <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">Basic Info</h2>
            <div className="space-y-4">
              {/* Activity Image */}
              <div>
                {renderField('Activity Image', false, '16:9 aspect ratio recommended')}
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    id="activity-img-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => updateData('primaryImage', reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        value={data.primaryImage}
                        onChange={(e) => updateData('primaryImage', e.target.value)}
                        placeholder="Paste image URL or upload file" />
                    </div>
                    <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('activity-img-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {data.primaryImage && (
                    <div className="mt-2">
                      <img
                        src={data.primaryImage}
                        alt={data.title}
                        className="w-full h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Recommended: 800×600px, JPG or PNG, max 5MB
                </div>
              </div>

              {/* Title */}
              <div data-invalid={publishAttempted && !data.title.trim() ? "true" : undefined}>
                {renderField('Title', true)}
                <Input
                  value={data.title}
                  onChange={(e) => updateData('title', e.target.value.slice(0, 55))}
                  placeholder="e.g., Plantation 4×4"
                  className={publishAttempted && !data.title.trim() ? "ring-2 ring-destructive" : ""} />
                <div className="text-xs text-muted-foreground mt-1">{data.title.length}/55</div>
              </div>

              {/* Subtitle */}
              <div data-invalid={publishAttempted && !data.subtitle.trim() ? "true" : undefined}>
                {renderField('Subtitle', true, 'Short tagline shown below the title in the guest app')}
                <Input
                  value={data.subtitle}
                  onChange={(e) => updateData('subtitle', e.target.value.slice(0, 100))}
                  placeholder="e.g., Guided Jeep Tour"
                  className={publishAttempted && !data.subtitle.trim() ? "ring-2 ring-destructive" : ""} />
                <div className="text-xs text-muted-foreground mt-1">{data.subtitle.length}/100</div>
              </div>

              {/* Description */}
              <div data-invalid={publishAttempted && !data.description.trim() ? "true" : undefined}>
                {renderField('Description', true)}
                <Textarea
                  value={data.description}
                  onChange={(e) => updateData('description', e.target.value.slice(0, 400))}
                  placeholder="A guided walking tour of our 300-acre working coffee and spice plantation..."
                  className={`min-h-[100px]${publishAttempted && !data.description.trim() ? " ring-2 ring-destructive" : ""}`} />
                <div className="text-xs text-muted-foreground mt-1">{data.description.length}/400</div>
              </div>

              {/* Categories */}
              <div>
                {renderField('Categories', false, 'Determines which filter tab this activity appears under in the guest app')}
                <div className="flex gap-2 flex-wrap mt-1">
                  {["Experiences", "Vaidyashala", "Dining", "Transfers"].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        const current = data.categories ?? [];
                        updateData('categories', current.includes(cat)
                          ? current.filter((c) => c !== cat)
                          : [...current, cat]);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full border text-sm transition-colors",
                        (data.categories ?? []).includes(cat)
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground/40"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════ SECTION 2: CAPACITY & GUESTS ═══════════════════ */}
          <div className={sectionCard}>
            <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">Capacity & Guests</h2>
            <div className="space-y-4">
              {/* Group size */}
              <div>
                {renderField('Group size')}
                <div className="flex items-center gap-2">
                  <NumericInput
                    value={data.groupSizeMin}
                    onChangeValue={(value) => updateData('groupSizeMin', value)}
                    className="w-20"
                    min={1} />
                  <span className="text-muted-foreground">–</span>
                  <NumericInput
                    value={data.groupSizeMax}
                    onChangeValue={(value) => updateData('groupSizeMax', value)}
                    className="w-20"
                    min={1} />
                </div>
              </div>

              {/* Capacity unit */}
              <div>
                {renderField('Capacity unit', false, 'Appears after group size (e.g., "Max 5 adults per vehicle")')}
                <Input
                  value={data.capacityUnit}
                  onChange={(e) => updateData('capacityUnit', e.target.value.slice(0, 30))}
                  placeholder="e.g., per vehicle, per boat, per coracle, per session" />
                <div className="text-xs text-muted-foreground mt-1">{data.capacityUnit.length}/30</div>
              </div>

              {/* Guest can choose group size */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="guest-group-size" className="text-sm font-medium text-foreground cursor-pointer">
                    Guest can choose group size
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">ON: Guests can select the number of people. OFF: Group size is fixed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="guest-group-size"
                  checked={data.guestCanChooseGroupSize}
                  onCheckedChange={(checked) => updateData('guestCanChooseGroupSize', checked)} />
              </div>
            </div>
          </div>

          {/* ═══════════════════ SECTION 3: SCHEDULING ═══════════════════ */}
          <div className={sectionCard}>
            <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">Scheduling</h2>
            <div className="space-y-6">
              {/* Property Scheduled toggle */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <CalendarOff className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="property-scheduled" className="text-sm font-medium text-foreground cursor-pointer">
                    Property Scheduled
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">When ON, the activity runs all day — guests pick only a date. When OFF, the property sets specific time slots for guests to choose from.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="property-scheduled"
                  checked={data.propertyScheduled}
                  onCheckedChange={(checked) => updateData('propertyScheduled', checked)} />
              </div>

              {/* Days */}
              <div>
                {renderField('Days')}
                <div className="flex gap-1">
                  {dayLabels.map((day, index) => (
                    <Toggle
                      key={day}
                      pressed={data.days[index]}
                      onPressedChange={() => toggleDay(index)}
                      size="sm"
                      className="w-12 h-8 text-xs">
                      {day}
                    </Toggle>
                  ))}
                </div>
              </div>

              {/* Time Slots — only when Property Scheduled is OFF */}
              {!data.propertyScheduled && (
                <>
                  <div>
                    {renderField('Time Slots', false, 'Slot label and time range appear on time slot cards in the guest app (e.g., "Morning — 10:30 AM – 12:15 PM")')}
                    <div className="space-y-3">
                      {data.timeSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border">
                          <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 items-center">
                            <Input
                              value={slot.label}
                              onChange={(e) => updateTimeSlot(slot.id, 'label', e.target.value.slice(0, 30))}
                              placeholder="e.g., Morning"
                              className="text-sm" />
                            <Select value={slot.startHour} onValueChange={(v) => updateTimeSlot(slot.id, 'startHour', v)}>
                              <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={slot.startMin} onValueChange={(v) => updateTimeSlot(slot.id, 'startMin', v)}>
                              <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground text-sm">to</span>
                            <Select value={slot.endHour} onValueChange={(v) => updateTimeSlot(slot.id, 'endHour', v)}>
                              <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={slot.endMin} onValueChange={(v) => updateTimeSlot(slot.id, 'endMin', v)}>
                              <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeTimeSlot(slot.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={addTimeSlot}>
                      <Plus className="w-4 h-4" />
                      Add time slot
                    </Button>
                  </div>

                  {/* Cut-off */}
                  <div>
                    {renderField('Cut-off (before slot)', false, 'Slots within this window before start time are hidden from guests')}
                    <div className="flex items-center gap-2">
                      <Select
                        value={String(Math.floor(data.cutoff / 60))}
                        onValueChange={(val) => updateData('cutoff', parseInt(val) * 60 + (data.cutoff % 60))}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 25 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>{i} hr</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(data.cutoff % 60)}
                        onValueChange={(val) => updateData('cutoff', Math.floor(data.cutoff / 60) * 60 + parseInt(val))}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 5, 10, 15, 20, 25, 30, 45].map((m) => (
                            <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Blocked Dates */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                  <CalendarOff className="w-4 h-4 text-muted-foreground" />
                  Blocked Dates
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Block specific dates when this activity is unavailable. Guests will not see these dates.</p>
                <Popover open={blockedDatePickerOpen} onOpenChange={setBlockedDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add blocked date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      onSelect={(d) => { addBlockedDate(d); setBlockedDatePickerOpen(false); }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                {data.blackoutDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.blackoutDates
                      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                      .map((date, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {format(new Date(date), "EEE, dd MMM")}
                          <button onClick={() => removeBlockedDate(index)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* Slots per session — only when Property Scheduled OFF */}
              {!data.propertyScheduled && (
                <div>
                  {renderField('Slots per session', false, 'Maximum bookings per time slot per day. When full, the slot shows as "Sold Out" in the guest app.')}
                  <NumericInput
                    value={data.slotsPerSession}
                    onChangeValue={(value) => updateData('slotsPerSession', value)}
                    className="w-24"
                    min={1} />
                </div>
              )}

              {/* Bookings per day — only when Property Scheduled ON */}
              {data.propertyScheduled && (
                <div>
                  {renderField('Bookings per day', false, 'Maximum bookings per day. When full, the date shows as unavailable.')}
                  <NumericInput
                    value={data.bookingsPerDay}
                    onChangeValue={(value) => updateData('bookingsPerDay', value)}
                    className="w-24"
                    min={1} />
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════ SECTION 4: PRICING ═══════════════════ */}
          <div className={sectionCard}>
            <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">Pricing</h2>
            <div className="space-y-4">
              {/* Complimentary toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.complimentary}
                  onCheckedChange={(checked) => {
                    updateData('complimentary', checked);
                    if (checked) updateData('adultPrice', 0);
                  }} />
                <Label className="text-sm font-medium text-foreground">Complimentary</Label>
                <span className="text-xs text-muted-foreground">Toggle on if this activity is free for guests</span>
              </div>

              {!data.complimentary && (
                <>
                  {/* Pricing model */}
                  <div>
                    {renderField('Pricing model')}
                    <div className="flex rounded-md border border-border w-fit">
                      {(['Per person', 'Per group'] as const).map((model) => (
                        <button
                          key={model}
                          onClick={() => {
                            updateData('pricingModel', model);
                            if (model === 'Per group' && (!data.pricingLabel || data.pricingLabel === 'Per person' || data.pricingLabel === 'per person (incl. taxes)')) {
                              updateData('pricingLabel', 'Per group');
                            } else if (model === 'Per person' && data.pricingLabel === 'Per group') {
                              updateData('pricingLabel', 'Per person');
                            }
                          }}
                          className={`px-4 py-2 text-sm font-medium first:rounded-l-md last:rounded-r-md transition-colors ${
                            data.pricingModel === model
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary text-foreground'
                          }`}>
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    {renderField(data.pricingModel === 'Per person' ? 'Price per person' : 'Group price')}
                    <div className="flex w-48">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-secondary text-sm text-foreground">
                        {data.currency}
                      </span>
                      <NumericInput
                        value={data.adultPrice}
                        onChangeValue={(value) => updateData('adultPrice', value)}
                        className="rounded-l-none" />
                    </div>
                  </div>

                  {/* Pricing label */}
                  <div>
                    {renderField('Pricing label', false, 'Descriptive text shown above the price in the guest app')}
                    <Input
                      value={data.pricingLabel}
                      onChange={(e) => updateData('pricingLabel', e.target.value.slice(0, 150))}
                      placeholder="e.g., Per vehicle, For up to 2 persons inclusive of a private guide, entry charges & all taxes" />
                    <div className="text-xs text-muted-foreground mt-1">{data.pricingLabel.length}/150</div>
                  </div>

                  {/* Duration display */}
                  <div>
                    {renderField('Duration display', false, 'Shown in the pricing card. Leave blank to hide.')}
                    <Input
                      value={data.durationDisplayText}
                      onChange={(e) => updateData('durationDisplayText', e.target.value.slice(0, 40))}
                      placeholder="e.g., 3 hours, 90 minutes, Half day" />
                    <div className="text-xs text-muted-foreground mt-1">{data.durationDisplayText.length}/40</div>
                  </div>

                  {/* People accommodated — only for Per group */}
                  {data.pricingModel === 'Per group' && (
                    <div>
                      {renderField('People accommodated')}
                      <div className="flex items-center gap-2">
                        <NumericInput
                          value={data.peopleAccommodatedMin}
                          onChangeValue={(value) => updateData('peopleAccommodatedMin', value)}
                          className="w-20"
                          min={1} />
                        <span className="text-muted-foreground">–</span>
                        <NumericInput
                          value={data.peopleAccommodatedMax}
                          onChangeValue={(value) => updateData('peopleAccommodatedMax', value)}
                          className="w-20"
                          min={1} />
                        <span className="text-sm text-muted-foreground">people</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Publish Button at Bottom */}
          <div className="flex justify-end pt-6 pb-2">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              onClick={() => handleSave('Published')}
              disabled={isSaving}>
              {isSaving
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : (!isValid && <span className="bg-destructive text-destructive-foreground text-xs px-1 rounded-full mr-2">{validationErrors.length}</span>)
              }
              {isSaving ? "Publishing…" : "Publish"}
            </Button>
          </div>

        </div>
      </div>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <span className="text-sm">Changes saved</span>
          <button onClick={undo} className="text-primary-foreground/70 hover:text-primary-foreground text-sm underline">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
