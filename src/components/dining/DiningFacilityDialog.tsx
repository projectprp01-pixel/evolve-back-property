import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Upload, Camera, UtensilsCrossed, Wine, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface DiningFacility {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cuisineType: string;
  hours: string;
  image: string;
  isActive: boolean;
  isSignature?: boolean;
  reservationMode: "reservations" | "info-only";
  signatureDishes?: any[];
  bestSellingDishes?: string[];
  menuImages?: string[];
  facilityType: "restaurant" | "intimate_dining";
  mealTimes?: string[];
  maxGuests?: number;
  whatsIncluded?: string[];
  guestNote?: string;
  price?: number;
  pricingLabel?: string;
  blockedDates?: string[];
  tablesPerNight?: number;
}

interface DiningFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility?: DiningFacility | null;
  onSave: (facility: Partial<DiningFacility>) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function DiningFacilityDialog({ open, onOpenChange, facility, onSave, onImageUpload }: DiningFacilityDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [facilityType, setFacilityType] = useState<"restaurant" | "intimate_dining">("restaurant");
  const [formData, setFormData] = useState({
    name: "",
    subtitle: "",
    description: "",
    cuisineType: "",
    image: "",
    isActive: true,
    reservationMode: "info-only" as "reservations" | "info-only",
    mealTimes: [] as string[],
    maxGuests: 2,
    whatsIncluded: [] as string[],
    guestNote: "",
    price: 0,
    pricingLabel: "",
    blockedDates: [] as Date[],
    tablesPerNight: 4,
  });

  const [imagePreview, setImagePreview] = useState("");
  const [newIncludedItem, setNewIncludedItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (facility) {
      setFacilityType(facility.facilityType || "restaurant");
      setFormData({
        name: facility.name || "",
        subtitle: facility.subtitle || "",
        description: facility.description || "",
        cuisineType: facility.cuisineType || "",
        image: facility.image || "",
        isActive: facility.isActive,
        reservationMode: facility.reservationMode || "info-only",
        mealTimes: facility.mealTimes || [],
        maxGuests: facility.maxGuests || 2,
        whatsIncluded: facility.whatsIncluded || [],
        guestNote: facility.guestNote || "",
        price: facility.price || 0,
        pricingLabel: facility.pricingLabel || "",
        blockedDates: (facility.blockedDates || []).map(d => new Date(d)),
        tablesPerNight: facility.tablesPerNight || 4,
      });
      setImagePreview(facility.image || "");
    } else {
      setFacilityType("restaurant");
      setFormData({
        name: "", subtitle: "", description: "", cuisineType: "",
        image: "", isActive: true, reservationMode: "info-only",
        mealTimes: [], maxGuests: 2, whatsIncluded: [],
        guestNote: "", price: 0, pricingLabel: "", blockedDates: [], tablesPerNight: 4,
      });
      setImagePreview("");
    }
    setErrors({});
  }, [facility, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (onImageUpload) {
      setUploadingImage(true);
      try {
        const url = await onImageUpload(file);
        setImagePreview(url);
        setFormData(prev => ({ ...prev, image: url }));
      } catch {
        // keep existing image if upload fails
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      // Fallback: local preview only (used in development without backend)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData(prev => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleMealTime = (meal: string) => {
    setFormData(prev => ({
      ...prev,
      mealTimes: prev.mealTimes.includes(meal)
        ? prev.mealTimes.filter(m => m !== meal)
        : [...prev.mealTimes, meal],
    }));
  };

  const addIncludedItem = () => {
    if (newIncludedItem.trim() && !formData.whatsIncluded.includes(newIncludedItem.trim())) {
      setFormData(prev => ({ ...prev, whatsIncluded: [...prev.whatsIncluded, newIncludedItem.trim()] }));
      setNewIncludedItem("");
    }
  };

  const removeIncludedItem = (item: string) => {
    setFormData(prev => ({ ...prev, whatsIncluded: prev.whatsIncluded.filter(i => i !== item) }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Facility name is required";
    if (!formData.subtitle.trim()) newErrors.subtitle = "Subtitle is required";
    if (!formData.description.trim()) newErrors.description = "About is required";
    if (!formData.image) newErrors.image = "Facility image is required";
    if (facilityType === "intimate_dining" && (!formData.price || formData.price <= 0)) {
      newErrors.price = "Price is required for intimate dining";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...formData,
      id: facility?.id || `facility_${Date.now()}`,
      facilityType,
      reservationMode: facilityType === "restaurant" ? "info-only" : formData.reservationMode,
      hours: facilityType === "restaurant" ? formData.mealTimes.join(", ") : "",
      blockedDates: formData.blockedDates.map(d => format(d, 'yyyy-MM-dd')),
      tablesPerNight: facilityType === "intimate_dining" ? formData.tablesPerNight : undefined,
    });
    onOpenChange(false);
  };

  const handleFacilityTypeChange = (newType: "restaurant" | "intimate_dining") => {
    if (facility && newType !== facilityType) {
      if (!window.confirm("Changing the facility type may affect how it appears in the guest app. Continue?")) return;
    }
    setFacilityType(newType);
    if (newType === "restaurant") {
      setFormData(p => ({ ...p, reservationMode: "info-only" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {facility ? "Edit Dining Facility" : "Add New Dining Facility"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Facility Type Selector */}
          <div className="space-y-3">
            <Label>Facility Type <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={facilityType}
              onValueChange={(v) => handleFacilityTypeChange(v as "restaurant" | "intimate_dining")}
              className="grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="type-restaurant"
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                  facilityType === "restaurant" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                )}
              >
                <RadioGroupItem value="restaurant" id="type-restaurant" className="mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    Restaurant
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Standard dining venue (e.g., buffet, à la carte)
                  </p>
                </div>
              </label>
              <label
                htmlFor="type-intimate"
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                  facilityType === "intimate_dining" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                )}
              >
                <RadioGroupItem value="intimate_dining" id="type-intimate" className="mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    <Wine className="h-4 w-4 text-primary" />
                    Intimate Dining
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Curated private dining experiences
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Facility Image <span className="text-destructive">*</span></Label>
            {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-32 h-24 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={handleRemoveImage}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/30">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground">Recommended: 800×600px, JPG or PNG, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Name & Subtitle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name <span className="text-destructive">*</span></Label>
              <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Granary" maxLength={40} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              <p className="text-xs text-muted-foreground text-right">{formData.name.length}/40</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle <span className="text-destructive">*</span></Label>
              <Input id="subtitle" value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} placeholder={facilityType === "restaurant" ? "e.g., Multicuisine Restaurant" : "e.g., Intimate Lakeside Dining"} maxLength={60} />
              {errors.subtitle && <p className="text-xs text-destructive">{errors.subtitle}</p>}
              <p className="text-xs text-muted-foreground text-right">{formData.subtitle.length}/60</p>
            </div>
          </div>

          {/* About */}
          <div className="space-y-2">
            <Label htmlFor="description">About <span className="text-destructive">*</span></Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe the dining facility..." rows={3} maxLength={300} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            <p className="text-xs text-muted-foreground text-right">{formData.description.length}/300</p>
          </div>

          {/* === RESTAURANT-SPECIFIC FIELDS === */}
          {facilityType === "restaurant" && (
            <div className="space-y-6 animate-in fade-in-0 duration-300">
              {/* Cuisine Type */}
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Type</Label>
                <Input id="cuisineType" value={formData.cuisineType} onChange={e => setFormData(p => ({ ...p, cuisineType: e.target.value }))} placeholder="e.g., Continental, Indian, Multicuisine" maxLength={30} />
                <p className="text-xs text-muted-foreground">Separate multiple cuisines with commas</p>
                <p className="text-xs text-muted-foreground text-right">{formData.cuisineType.length}/30</p>
              </div>

              {/* Meal Times */}
              <div className="space-y-3">
                <Label>Meal Times</Label>
                <div className="flex gap-3">
                  {[
                    { id: "breakfast", label: "Breakfast", emoji: "☀️" },
                    { id: "lunch", label: "Lunch", emoji: "🌤️" },
                    { id: "dinner", label: "Dinner", emoji: "🌙" },
                  ].map(meal => (
                    <label
                      key={meal.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-3 cursor-pointer transition-all",
                        formData.mealTimes.includes(meal.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <Checkbox
                        checked={formData.mealTimes.includes(meal.id)}
                        onCheckedChange={() => toggleMealTime(meal.id)}
                      />
                      <span className="text-sm">{meal.emoji} {meal.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* === INTIMATE DINING-SPECIFIC FIELDS === */}
          {facilityType === "intimate_dining" && (
            <div className="space-y-6 animate-in fade-in-0 duration-300">
              {/* Max Guests */}
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Max Guests Per Table</Label>
                <Input id="maxGuests" type="number" min={1} max={20} value={formData.maxGuests ?? ""} onChange={e => { const raw = e.target.value; setFormData(p => ({ ...p, maxGuests: raw === "" ? undefined : parseInt(raw) })); }} placeholder="e.g., 2" className="w-32" />
                <p className="text-xs text-muted-foreground">e.g., 2 — renders as "👥 2 guests per table" in the guest app</p>
              </div>

              {/* What's Included */}
              <div className="space-y-3">
                <Label>What's Included</Label>
                <div className="flex gap-2">
                  <Input value={newIncludedItem} onChange={e => setNewIncludedItem(e.target.value)} placeholder="e.g., Five-course menu" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addIncludedItem())} />
                  <Button type="button" onClick={addIncludedItem} size="icon"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.whatsIncluded.map(item => (
                    <Badge key={item} variant="secondary" className="pr-1">
                      {item}
                      <Button variant="ghost" size="sm" className="h-auto p-0 ml-1 hover:bg-transparent" onClick={() => removeIncludedItem(item)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Guest Note */}
              <div className="space-y-2">
                <Label htmlFor="guestNote">Guest Note</Label>
                <Textarea id="guestNote" value={formData.guestNote} onChange={e => setFormData(p => ({ ...p, guestNote: e.target.value }))} placeholder="Any additional information for the guest" rows={2} maxLength={200} />
                <p className="text-xs text-muted-foreground text-right">{formData.guestNote.length}/200</p>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <Label>Pricing <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                      <Input type="number" min={0} value={formData.price ?? ""} onChange={e => { const raw = e.target.value; setFormData(p => ({ ...p, price: raw === "" ? undefined : parseFloat(raw) })); }} placeholder="2000" className="pl-7" />
                    </div>
                    {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                  </div>
                  <Input value={formData.pricingLabel} onChange={e => setFormData(p => ({ ...p, pricingLabel: e.target.value }))} placeholder="e.g., Per couple, inclusive of taxes" maxLength={50} />
                </div>
              </div>

              {/* Booking Capacity */}
              <div className="space-y-2">
                <Label htmlFor="tablesPerNight">Booking Capacity <span className="text-destructive">*</span></Label>
                <div className="space-y-1">
                  <Input id="tablesPerNight" type="number" min={1} max={50} value={formData.tablesPerNight ?? ""} onChange={e => { const raw = e.target.value; setFormData(p => ({ ...p, tablesPerNight: raw === "" ? undefined : parseInt(raw) })); }} placeholder="e.g., 4" className="w-40" />
                  <p className="text-xs text-muted-foreground">Tables available per night. Once all tables are booked for a date, the experience will automatically show as sold out in the guest app.</p>
                </div>
              </div>

              {/* Blocked Dates */}
              <div className="space-y-2">
                <Label>Blocked Dates</Label>
                <p className="text-xs text-muted-foreground">This experience is available every day by default. Block specific dates when it's not available.</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.blockedDates.length && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.blockedDates.length > 0
                        ? `${formData.blockedDates.length} date(s) blocked`
                        : "No dates blocked"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={formData.blockedDates}
                      onSelect={(dates) => setFormData(p => ({ ...p, blockedDates: dates || [] }))}
                      disabled={(date) => date < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                      modifiers={{ blocked: formData.blockedDates }}
                      modifiersClassNames={{ blocked: "!bg-destructive/20 !text-destructive line-through" }}
                    />
                  </PopoverContent>
                </Popover>
                {formData.blockedDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.blockedDates.sort((a, b) => a.getTime() - b.getTime()).map(date => (
                      <Badge key={date.toISOString()} variant="secondary" className="text-xs pr-1 bg-destructive/10 text-destructive border-destructive/20">
                        {format(date, "EEE, MMM d")}
                        <Button variant="ghost" size="sm" className="h-auto p-0 ml-1 hover:bg-transparent" onClick={() => setFormData(p => ({ ...p, blockedDates: p.blockedDates.filter(d => d.getTime() !== date.getTime()) }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={checked => setFormData(p => ({ ...p, isActive: checked }))} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>{facility ? "Update Facility" : "Create Facility"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
