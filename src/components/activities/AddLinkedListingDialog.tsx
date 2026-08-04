import { useState, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ActivityData } from "./ActivityEditor";
import { dashboardAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface DestinationOption {
  key: string;
  label: string;
  path: string;
  group: string;
}

const TAG_OPTIONS = ["Experiences", "Vaidyashala", "Dining", "Transfers"];

const STATIC_OPTIONS: DestinationOption[] = [
  { key: "page-transfers", label: "Transfers / How to Reach", path: "/how-to-get-here", group: "Pages" },
  { key: "page-food", label: "Food & Beverage Hub", path: "/food-beverage", group: "Pages" },
  { key: "page-spa", label: "Vaidyashala / Spa Package", path: "/spa-package", group: "Pages" },
  { key: "custom", label: "Custom URL", path: "custom", group: "Pages" },
];

interface AddLinkedListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ActivityData) => void;
  editData?: ActivityData | null;
}

export default function AddLinkedListingDialog({
  open,
  onOpenChange,
  onSave,
  editData,
}: AddLinkedListingDialogProps) {
  const [displayName, setDisplayName] = useState(editData?.title ?? "");
  const [bannerImage, setBannerImage] = useState(editData?.primaryImage ?? "");
  const [ctaLabel, setCtaLabel] = useState(editData?.ctaLabel ?? "Book Now");
  const [redirectTo, setRedirectTo] = useState(editData?.redirectPath ?? "");
  const [customUrl, setCustomUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(editData?.categories ?? []);

  const { data: experiences = [], isLoading: expLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => dashboardAPI.getAllExperiences(),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const { data: spas = [], isLoading: spaLoading } = useQuery({
    queryKey: ['dashboard-spa'],
    queryFn: () => dashboardAPI.getAllSpaFacilities(),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const { data: restaurants = [], isLoading: restLoading } = useQuery({
    queryKey: ['dashboard-restaurants'],
    queryFn: () => dashboardAPI.getAllRestaurants(),
    staleTime: 5 * 60_000,
    enabled: open,
  });

  const loading = expLoading || spaLoading || restLoading;

  const options: DestinationOption[] = [
    ...(experiences as any[])
      .filter((e) => e.isActive !== false)
      .map((e) => ({ key: `exp-${e._id}`, label: e.title, path: `/experience/${e._id}`, group: "Experiences" })),
    ...(spas as any[])
      .filter((s) => s.isActive !== false)
      .map((s) => ({ key: `spa-${s._id}`, label: s.name, path: `/spa-package`, group: "Spa / Vaidyashala" })),
    ...(restaurants as any[])
      .filter((r) => r.isActive !== false && r.facilityType === 'intimate_dining')
      .map((r) => ({ key: `dining-${r._id}`, label: r.name, path: `/restaurant/${r._id}`, group: "Dining" })),
    ...STATIC_OPTIONS,
  ];

  // Re-sync when editData changes
  useEffect(() => {
    if (editData) {
      setDisplayName(editData.title ?? "");
      setBannerImage(editData.primaryImage ?? "");
      setCtaLabel(editData.ctaLabel ?? "Book Now");
      setRedirectTo(editData.redirectPath ?? "");
      setSelectedTags(editData.categories ?? []);
    }
  }, [editData]);

  const isCustom = redirectTo === "custom";

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const finalRedirect = isCustom ? customUrl : redirectTo;
    if (!displayName.trim() || !finalRedirect) return;

    const linked: ActivityData = {
      id: editData?.id,
      type: 'linked',
      title: displayName.trim(),
      primaryImage: bannerImage,
      ctaLabel: ctaLabel || "Book Now",
      redirectPath: finalRedirect,
      categories: selectedTags,
      subtitle: "",
      description: "",
      isActive: true,
      groupSizeMin: 1,
      groupSizeMax: 1,
      capacityUnit: "",
      guestCanChooseGroupSize: false,
      propertyScheduled: false,
      days: [true, true, true, true, true, true, true],
      timeSlots: [],
      cutoff: 0,
      blackoutDates: [],
      slotsPerSession: 0,
      bookingsPerDay: 0,
      complimentary: false,
      pricingModel: "Per person",
      currency: "INR",
      adultPrice: 0,
      pricingLabel: "",
      durationDisplayText: "",
      peopleAccommodatedMin: 1,
      peopleAccommodatedMax: 1,
      status: "Published",
      summary: "",
      overview: "",
      noteDisclaimer: "",
      durationMin: 0,
      durationMax: 0,
      difficulty: "Easy",
      meetingPoint: "",
      imageAlt: displayName.trim(),
      included: [],
      excluded: [],
      times: [],
      timeSlotLabels: {},
      buffer: 0,
      taxInclusive: true,
      childPrice: 0,
      childAgeRange: "",
      guestNote: "",
    };

    onSave(linked);
    onOpenChange(false);
  };

  // Group options
  const groups: Record<string, DestinationOption[]> = {};
  for (const opt of options) {
    if (!groups[opt.group]) groups[opt.group] = [];
    groups[opt.group].push(opt);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Linked Listing" : "Link Existing Listing"}</DialogTitle>
          <DialogDescription>
            Create a listing card that redirects guests to an existing page (Spa, Dining, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Display Name */}
          <div>
            <Label className="text-sm font-medium">Display Name <span className="text-destructive">*</span></Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 80))}
              placeholder="e.g., Vaidyashala, The Machan"
              className="mt-1"
            />
          </div>

          {/* Banner Image */}
          <div>
            <Label className="text-sm font-medium">Banner Image</Label>
            <div className="mt-1">
              {bannerImage ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setBannerImage("")}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          {/* CTA Label */}
          <div>
            <Label className="text-sm font-medium">CTA Label</Label>
            <Input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value.slice(0, 30))}
              placeholder="Book Now"
              className="mt-1"
            />
          </div>

          {/* Redirect To */}
          <div>
            <Label className="text-sm font-medium">Redirect To <span className="text-destructive">*</span></Label>
            <Select value={redirectTo} onValueChange={setRedirectTo} disabled={loading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loading ? "Loading…" : "Select destination"} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  Object.entries(groups).map(([group, opts]) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {opts.map((opt) => (
                        <SelectItem key={opt.key} value={opt.path}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                )}
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/custom-page or https://..."
                className="mt-2"
              />
            )}
          </div>

          {/* Categories / Tags */}
          <div>
            <Label className="text-sm font-medium">Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TAG_OPTIONS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer select-none transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!displayName.trim() || (!redirectTo || (isCustom && !customUrl))}
            className="bg-[hsl(var(--amber))] hover:bg-[hsl(var(--amber))]/90 text-white"
          >
            {editData ? "Update Listing" : "Create Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
