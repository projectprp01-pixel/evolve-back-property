import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2 } from "lucide-react";
import { dashboardAPI } from "@/services/api";
import { useProperty } from "@/context/PropertyContext";
import { toast } from "sonner";

export interface HeroBannerItem {
  id: string;
  type: "linked" | "custom";
  linkedItemId?: string;
  actionType?: "experience" | "link" | "restaurant" | "none";
  heading: string;
  subtext: string;
  ctaLabel: string;
  bannerImage: string;
  redirectPath: string;
  tags: string[];
  displayOrder: number;
  isVisible: boolean;
}

interface LinkableItem {
  id: string;
  title: string;
  summary: string;
  category: "experience" | "spa" | "dining" | "page";
  actionType: "experience" | "link" | "restaurant";
  actionValue: string; // either item._id or a page path
}

const TAG_OPTIONS = ["Family", "Nature", "Wellness", "Couples", "Adventure", "Dining", "Promo"];

const PAGE_LINKS = [
  { label: "Transfers / How to Reach", value: "/how-to-get-here", actionType: "link" as const },
  { label: "Intimate Dining", value: "/food-beverage?tab=intimate", actionType: "link" as const },
];

interface AddBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Omit<HeroBannerItem, "id" | "displayOrder" | "isVisible">) => void;
  editItem?: HeroBannerItem | null;
  onUpdate?: (item: Omit<HeroBannerItem, "id" | "displayOrder" | "isVisible">) => void;
}

export default function AddBannerDialog({ open, onOpenChange, onSubmit, editItem, onUpdate }: AddBannerDialogProps) {
  const isEditing = !!editItem;
  const { selectedProperty } = useProperty();
  const propertyId = selectedProperty.id;

  const [selectedItemKey, setSelectedItemKey] = useState<string>("");
  const [bannerImage, setBannerImage] = useState("");
  const [headingOverride, setHeadingOverride] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: rawExps = [], isLoading: expLoading } = useQuery({
    queryKey: ['experiences', propertyId],
    queryFn: () => dashboardAPI.getAllExperiences(propertyId),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const { data: rawSpas = [], isLoading: spaLoading } = useQuery({
    queryKey: ['dashboard-spa', propertyId],
    queryFn: () => dashboardAPI.getAllSpaFacilities(propertyId),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const { data: rawRestaurants = [], isLoading: restLoading } = useQuery({
    queryKey: ['dashboard-restaurants', propertyId],
    queryFn: () => dashboardAPI.getAllRestaurants(propertyId),
    staleTime: 5 * 60_000,
    enabled: open,
  });

  const loadingItems = expLoading || spaLoading || restLoading;

  const items: LinkableItem[] = [
    ...(rawExps as any[]).filter((e) => e.isActive !== false).map((e) => ({
      id: `exp-${e._id}`, title: e.title, summary: e.shortDescription ?? "",
      category: "experience" as const, actionType: "experience" as const, actionValue: e._id,
    })),
    ...(rawSpas as any[]).filter((s) => s.isActive !== false).map((s) => ({
      id: `spa-${s._id}`, title: s.name, summary: s.description ?? "",
      category: "spa" as const, actionType: "link" as const, actionValue: "/spa-package",
    })),
    ...(rawRestaurants as any[]).filter((r) => r.isActive !== false && r.facilityType === 'intimate_dining').map((r) => ({
      id: `dining-${r._id}`, title: r.name, summary: r.description ?? "",
      category: "dining" as const, actionType: "restaurant" as const, actionValue: r._id,
    })),
    ...PAGE_LINKS.map(p => ({
      id: `page-${p.value}`, title: p.label, summary: "",
      category: "page" as const, actionType: p.actionType, actionValue: p.value,
    })),
  ];

  // Pre-fill when editing
  useEffect(() => {
    if (editItem && open) {
      // Try to find the matching item key
      const match = items.find(
        i => i.actionValue === editItem.linkedItemId || i.actionValue === editItem.redirectPath
      );
      setSelectedItemKey(match?.id ?? "");
      setBannerImage(editItem.bannerImage);
      setHeadingOverride(editItem.heading);
      setCtaLabel(editItem.ctaLabel);
      setTags(editItem.tags);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editItem, open]);

  const resetForm = () => {
    setSelectedItemKey("");
    setBannerImage("");
    setHeadingOverride("");
    setCtaLabel("");
    setTags([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { imageUrl } = await dashboardAPI.uploadBannerImage(file);
      setBannerImage(imageUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = () => {
    const handler = isEditing ? onUpdate : onSubmit;
    if (!handler) return;

    if (!selectedItemKey && !isEditing) {
      toast.error("Please select a destination");
      return;
    }

    const selectedItem = items.find(i => i.id === selectedItemKey);
    const heading = headingOverride || selectedItem?.title || editItem?.heading || "";

    handler({
      type: "linked",
      linkedItemId: selectedItem?.actionValue,
      actionType: selectedItem?.actionType,
      heading,
      subtext: selectedItem?.summary || editItem?.subtext || "",
      ctaLabel: ctaLabel || "Learn More",
      bannerImage,
      redirectPath: "",
      tags,
    });
    resetForm();
    onOpenChange(false);
  };

  const experiences = items.filter(i => i.category === "experience");
  const spas = items.filter(i => i.category === "spa");
  const dinings = items.filter(i => i.category === "dining");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Banner" : "Add Hero Banner"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Destination selector */}
          <div className="space-y-2">
            <Label>Links To</Label>
            <Select
              value={selectedItemKey}
              onValueChange={setSelectedItemKey}
              disabled={loadingItems}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingItems ? "Loading…" : "Choose destination…"} />
              </SelectTrigger>
              <SelectContent>
                {experiences.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Experiences</SelectLabel>
                    {experiences.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {spas.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Spa / Vaidyashala</SelectLabel>
                    {spas.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {dinings.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Dining</SelectLabel>
                    {dinings.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>Pages</SelectLabel>
                  {PAGE_LINKS.map(p => (
                    <SelectItem key={`page-${p.value}`} value={`page-${p.value}`}>{p.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedItemKey && items.find(i => i.id === selectedItemKey)?.summary && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{items.find(i => i.id === selectedItemKey)?.title}</p>
                <p className="text-muted-foreground">{items.find(i => i.id === selectedItemKey)?.summary}</p>
              </div>
            )}
          </div>

          {/* Heading override */}
          <div className="space-y-2">
            <Label>Heading <span className="text-muted-foreground text-xs">(optional override)</span></Label>
            <Input
              placeholder="Leave blank to use default"
              value={headingOverride}
              onChange={e => setHeadingOverride(e.target.value)}
            />
          </div>

          {/* CTA Label */}
          <div className="space-y-2">
            <Label>CTA Button Label</Label>
            <Input
              placeholder="e.g. Book Now, Explore, Learn More"
              value={ctaLabel}
              onChange={e => setCtaLabel(e.target.value)}
            />
          </div>

          {/* Banner Image */}
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div
              className="border-2 border-dashed border-input rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => !uploading && document.getElementById("banner-upload-input")?.click()}
            >
              {bannerImage ? (
                <div className="relative">
                  <img src={bannerImage} alt="Banner preview" className="w-full h-32 object-cover rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={(e) => { e.stopPropagation(); setBannerImage(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Uploading to Cloudinary…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Click to upload (JPEG, PNG, WebP)</span>
                </div>
              )}
            </div>
            <input
              id="banner-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(tag => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                >
                  {tag}
                  {tags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save Changes" : "Add Banner"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
