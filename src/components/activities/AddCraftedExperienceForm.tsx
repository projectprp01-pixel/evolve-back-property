import { useState, useRef } from "react";
import { Plus, X, Upload, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dashboardAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface AddCraftedExperienceFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function AddCraftedExperienceForm({ onSubmit, onCancel }: AddCraftedExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    categories: [] as string[],
    durationMin: 60,
    durationMax: 120,
    groupSizeMin: 2,
    groupSizeMax: 10,
    difficulty: "Easy",
    meetingPoint: "",
    primaryImage: "",
    heroImage: "",
    shortDescription: "",
    includedItems: ["Expert curator guide", "Premium materials", "Refreshments", "Souvenir package"],
    selectedDays: [] as string[],
    times: ["10:00", "15:00"],
    cutOffMins: 120,
    pricingModel: "Per person",
    adultPrice: 2500,
    childPrice: 1500,
    childAgeRange: "6-12"
  });

  const [newIncludedItem, setNewIncludedItem] = useState("");
  const [newTime, setNewTime] = useState("");
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const primaryFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, field: "primaryImage" | "heroImage", setUploading: (v: boolean) => void) => {
    setUploading(true);
    try {
      const { imageUrl } = await dashboardAPI.uploadExperienceImage(file);
      setFormData(prev => ({ ...prev, [field]: imageUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const categories = ["Cultural", "Culinary", "Wellness", "Adventure", "Educational"];
  const difficulties = ["Easy", "Moderate", "Challenging"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const quickAddItems = ["Guide", "Materials", "Transfers", "Tastings", "Equipment", "Refreshments", "Photography", "Certification", "Insurance", "Souvenir"];

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDifficultySelect = (difficulty: string) => {
    setFormData(prev => ({ ...prev, difficulty }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleRemoveIncludedItem = (item: string) => {
    setFormData(prev => ({
      ...prev,
      includedItems: prev.includedItems.filter(i => i !== item)
    }));
  };

  const handleAddIncludedItem = () => {
    if (newIncludedItem.trim() && !formData.includedItems.includes(newIncludedItem.trim())) {
      setFormData(prev => ({
        ...prev,
        includedItems: [...prev.includedItems, newIncludedItem.trim()]
      }));
      setNewIncludedItem("");
    }
  };

  const handleQuickAddItem = (item: string) => {
    if (!formData.includedItems.includes(item)) {
      setFormData(prev => ({
        ...prev,
        includedItems: [...prev.includedItems, item]
      }));
    }
  };

  const handleAddTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime]
      }));
      setNewTime("");
    }
  };

  const handleRemoveTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter(t => t !== time)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.summary.trim() || !formData.shortDescription.trim() || formData.categories.length === 0) {
      return;
    }
    onSubmit(formData);
  };

  // Generate next 7 slots for display
  const generateNextSlots = () => {
    const slots = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      formData.times.forEach(time => {
        slots.push(`${dateStr} ${time}`);
      });
    }
    return slots;
  };

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto p-1">
      {/* Essentials */}
      <div>
        <h2 className="text-xl font-semibold text-accent mb-6">Essentials</h2>
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="title" className="font-medium">Title</Label>
              <span className="text-destructive text-sm">*</span>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter experience title"
              className="bg-muted"
            />
            <div className="text-xs text-muted-foreground mt-1">{formData.title.length}/55</div>
          </div>

          {/* One-line Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="summary" className="font-medium">One-line summary</Label>
              <span className="text-destructive text-sm">*</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief experience description"
              className="bg-muted"
            />
            <div className="text-xs text-muted-foreground mt-1">{formData.summary.length}/100</div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="font-medium">Categories</Label>
              <span className="text-destructive text-sm">*</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  type="button"
                  variant={formData.categories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category)}
                  className={cn(
                    "rounded-full",
                    formData.categories.includes(category) && "bg-accent text-accent-foreground"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration, Group Size, Difficulty Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Duration */}
            <div>
              <Label className="font-medium">Duration (mins)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  value={formData.durationMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMin: parseInt(e.target.value) || 0 }))}
                  className="bg-muted"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  value={formData.durationMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMax: parseInt(e.target.value) || 0 }))}
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Group Size */}
            <div>
              <Label className="font-medium">Group size</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  value={formData.groupSizeMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupSizeMin: parseInt(e.target.value) || 0 }))}
                  className="bg-muted"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  value={formData.groupSizeMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupSizeMax: parseInt(e.target.value) || 0 }))}
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <Label className="font-medium">Difficulty</Label>
              <div className="flex gap-1 mt-2">
                {difficulties.map(difficulty => (
                  <Button
                    key={difficulty}
                    type="button"
                    variant={formData.difficulty === difficulty ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDifficultySelect(difficulty)}
                    className={cn(
                      "rounded-full text-xs",
                      formData.difficulty === difficulty && "bg-accent text-accent-foreground"
                    )}
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting Point */}
          <div>
            <Label htmlFor="meetingPoint" className="font-medium">Meeting point</Label>
            <Input
              id="meetingPoint"
              value={formData.meetingPoint}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingPoint: e.target.value }))}
              placeholder="Where guests should meet"
              className="bg-muted mt-2"
            />
          </div>

          {/* Primary Image */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="font-medium">Primary image</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 bg-muted/30">
              {formData.primaryImage ? (
                <div className="flex items-center gap-3">
                  <img src={formData.primaryImage} alt="Primary" className="h-16 w-24 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{formData.primaryImage}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, primaryImage: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Paste image URL"
                    className="flex-1 mr-3 bg-background"
                    value={formData.primaryImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryImage: e.target.value }))}
                  />
                  <Button variant="outline" size="sm" disabled={uploadingPrimary} onClick={() => primaryFileRef.current?.click()}>
                    {uploadingPrimary ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={primaryFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "primaryImage", setUploadingPrimary);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">Primary image for the experience card</p>
          </div>

          {/* Hero Banner Image */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="font-medium">Hero banner image</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="border-2 border-dashed border-accent/20 rounded-lg p-6 bg-accent/5">
              {formData.heroImage ? (
                <div className="flex items-center gap-3">
                  <img src={formData.heroImage} alt="Hero" className="h-16 w-24 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{formData.heroImage}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, heroImage: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <p className="text-sm text-muted-foreground">Upload hero banner image</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 1920x800px for best display</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10 shrink-0" disabled={uploadingHero} onClick={() => heroFileRef.current?.click()}>
                    {uploadingHero ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload Banner
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "heroImage", setUploadingHero);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">This will be displayed as the main hero banner for this experience</p>
          </div>
        </div>
      </div>

      {/* Experience Overview */}
      <div>
        <h2 className="text-xl font-semibold text-accent mb-6">Experience Overview</h2>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="shortDescription" className="font-medium">Short description</Label>
            <span className="text-destructive text-sm">*</span>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <Textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            placeholder="Detailed description of the crafted experience"
            rows={4}
            className="bg-muted resize-none"
          />
          <div className="text-xs text-muted-foreground mt-1">{formData.shortDescription.length}/400</div>
        </div>
      </div>

      {/* What's Included */}
      <div>
        <h2 className="text-xl font-semibold text-accent mb-6">What's Included</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="font-medium">Included items</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.includedItems.map(item => (
                <Badge key={item} variant="secondary" className="pr-1">
                  {item}
                  <button
                    onClick={() => handleRemoveIncludedItem(item)}
                    className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={newIncludedItem}
                onChange={(e) => setNewIncludedItem(e.target.value)}
                placeholder="Type and press Enter to add"
                className="bg-muted"
                onKeyPress={(e) => e.key === 'Enter' && handleAddIncludedItem()}
              />
              <Button
                onClick={handleAddIncludedItem}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAddItems.map(item => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAddItem(item)}
                  className="text-xs"
                  disabled={formData.includedItems.includes(item)}
                >
                  + {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & Price */}
      <div>
        <h2 className="text-xl font-semibold text-accent mb-6">Schedule & Price</h2>
        <div className="space-y-6">
          {/* Days */}
          <div>
            <Label className="font-medium">Days</Label>
            <div className="flex gap-2 mt-2">
              {days.map(day => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.selectedDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayToggle(day)}
                  className={cn(
                    "rounded-full px-4",
                    formData.selectedDays.includes(day) && "bg-accent text-accent-foreground"
                  )}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div>
            <Label className="font-medium">Times</Label>
            <div className="flex items-center gap-2 mt-2 mb-3">
              {formData.times.map(time => (
                <Badge key={time} variant="secondary" className="pr-1">
                  {time}
                  <button
                    onClick={() => handleRemoveTime(time)}
                    className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                onClick={handleAddTime}
                variant="outline"
                size="sm"
                disabled={!newTime}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Time
              </Button>
            </div>
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32 bg-muted"
            />
          </div>

          {/* Cut-off */}
          <div>
            <Label htmlFor="cutOff" className="font-medium">Cut-off (mins before)</Label>
            <Input
              id="cutOff"
              type="number"
              value={formData.cutOffMins}
              onChange={(e) => setFormData(prev => ({ ...prev, cutOffMins: parseInt(e.target.value) || 0 }))}
              className="w-32 bg-muted mt-2"
            />
          </div>

          {/* Next 7 slots */}
          <div>
            <Label className="font-medium">Next 7 slots</Label>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {generateNextSlots().slice(0, 7).map((slot, index) => (
                <div key={index}>{slot}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h2 className="text-xl font-semibold text-accent mb-6">Pricing</h2>
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Model</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={formData.pricingModel === "Per person" ? "default" : "outline"}
                onClick={() => setFormData(prev => ({ ...prev, pricingModel: "Per person" }))}
                className={cn(
                  "flex-1",
                  formData.pricingModel === "Per person" && "bg-accent text-accent-foreground"
                )}
              >
                Per person
              </Button>
              <Button
                type="button"
                variant={formData.pricingModel === "Per group" ? "default" : "outline"}
                onClick={() => setFormData(prev => ({ ...prev, pricingModel: "Per group" }))}
                className={cn(
                  "flex-1",
                  formData.pricingModel === "Per group" && "bg-accent text-accent-foreground"
                )}
              >
                Per group
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adultPrice" className="font-medium">Adult price</Label>
              <div className="flex items-center mt-2">
                <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm">INR</span>
                <Input
                  id="adultPrice"
                  type="number"
                  value={formData.adultPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, adultPrice: parseInt(e.target.value) || 0 }))}
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="childPrice" className="font-medium">Child price (optional)</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center flex-1">
                  <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm">INR</span>
                  <Input
                    id="childPrice"
                    type="number"
                    value={formData.childPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, childPrice: parseInt(e.target.value) || 0 }))}
                    className="rounded-l-none"
                  />
                </div>
                <Input
                  value={formData.childAgeRange}
                  onChange={(e) => setFormData(prev => ({ ...prev, childAgeRange: e.target.value }))}
                  className="w-16 text-center bg-muted"
                  placeholder="6-12"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.title.trim() || !formData.summary.trim() || !formData.shortDescription.trim() || formData.categories.length === 0}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Create Experience
        </Button>
      </div>
    </div>
  );
}