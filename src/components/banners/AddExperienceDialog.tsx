import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link, Image, X, Upload } from "lucide-react";

export interface CraftedExperienceItem {
  id: string;
  type: "linked" | "custom";
  linkedItemId?: string;
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
}

const LINKABLE_ITEMS: LinkableItem[] = [
  { id: "1", title: "Heritage Coffee Trail", summary: "A curated walk through century-old coffee estates with expert-led tastings." },
  { id: "2", title: "Sunset Pottery Workshop", summary: "Hands-on pottery session with local artisans overlooking the valley." },
  { id: "3", title: "Forest Bathing Retreat", summary: "A guided mindfulness walk through ancient tropical forests." },
  { id: "4", title: "Farm-to-Table Cooking Class", summary: "Learn traditional recipes using freshly harvested ingredients from the estate." },
];

const REDIRECT_OPTIONS = [
  { label: "Activities", path: "/activities" },
  { label: "Food & Beverage", path: "/fnb" },
  { label: "Spa & Wellness", path: "/activities?filter=wellness" },
  { label: "Check-in", path: "/checkin" },
  { label: "Crafted Experiences", path: "/assets/crafted-experience" },
];

const TAG_OPTIONS = ["Cultural", "Culinary", "Wellness", "Adventure", "Educational", "Nature", "Family"];

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Omit<CraftedExperienceItem, "id" | "displayOrder" | "isVisible">) => void;
}

export default function AddExperienceDialog({ open, onOpenChange, onSubmit }: AddExperienceDialogProps) {
  const [tab, setTab] = useState<string>("linked");

  // Linked tab state
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [linkedBannerImage, setLinkedBannerImage] = useState("");
  const [linkedRedirectPath, setLinkedRedirectPath] = useState("");
  const [linkedCustomRedirect, setLinkedCustomRedirect] = useState("");
  const [linkedSubtextOverride, setLinkedSubtextOverride] = useState("");
  const [linkedCtaLabel, setLinkedCtaLabel] = useState("");

  // Custom tab state
  const [customHeading, setCustomHeading] = useState("");
  const [customSubtext, setCustomSubtext] = useState("");
  const [customCtaLabel, setCustomCtaLabel] = useState("");
  const [customBannerImage, setCustomBannerImage] = useState("");
  const [customRedirectPath, setCustomRedirectPath] = useState("");
  const [customCustomRedirect, setCustomCustomRedirect] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);

  const selectedItem = LINKABLE_ITEMS.find(i => i.id === selectedItemId);

  const resetForm = () => {
    setSelectedItemId("");
    setLinkedBannerImage("");
    setLinkedRedirectPath("");
    setLinkedCustomRedirect("");
    setLinkedSubtextOverride("");
    setLinkedCtaLabel("");
    setCustomHeading("");
    setCustomSubtext("");
    setCustomCtaLabel("");
    setCustomBannerImage("");
    setCustomRedirectPath("");
    setCustomCustomRedirect("");
    setCustomTags([]);
  };

  const handleSubmit = () => {
    if (tab === "linked") {
      if (!selectedItem) return;
      const redirect = linkedRedirectPath === "__custom__" ? linkedCustomRedirect : linkedRedirectPath;
      if (!redirect) return;
      onSubmit({
        type: "linked",
        linkedItemId: selectedItemId,
        heading: selectedItem.title,
        subtext: linkedSubtextOverride || selectedItem.summary,
        ctaLabel: linkedCtaLabel || "Explore",
        bannerImage: linkedBannerImage,
        redirectPath: redirect,
        tags: [],
      });
    } else {
      if (!customHeading || !customSubtext) return;
      const redirect = customRedirectPath === "__custom__" ? customCustomRedirect : customRedirectPath;
      if (!redirect) return;
      onSubmit({
        type: "custom",
        heading: customHeading,
        subtext: customSubtext,
        ctaLabel: customCtaLabel || "Explore",
        bannerImage: customBannerImage,
        redirectPath: redirect,
        tags: customTags,
      });
    }
    resetForm();
    onOpenChange(false);
  };

  const toggleTag = (tag: string) => {
    setCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Crafted Experience</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="linked" className="gap-1.5">
              <Link className="h-3.5 w-3.5" /> Link Existing
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-1.5">
              <Image className="h-3.5 w-3.5" /> Custom Experience
            </TabsTrigger>
          </TabsList>

          {/* Link Existing Tab */}
          <TabsContent value="linked" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Activity / Experience</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger><SelectValue placeholder="Choose an item…" /></SelectTrigger>
                <SelectContent>
                  {LINKABLE_ITEMS.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{selectedItem.title}</p>
                <p className="text-muted-foreground">{selectedItem.summary}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Subtext Override <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder={selectedItem?.summary || "Leave blank to use default"}
                value={linkedSubtextOverride}
                onChange={e => setLinkedSubtextOverride(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>CTA Button Label</Label>
              <Input
                placeholder="e.g. Explore, Book Now, Learn More"
                value={linkedCtaLabel}
                onChange={e => setLinkedCtaLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div
                className="border-2 border-dashed border-input rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("exp-linked-banner-upload")?.click()}
              >
                {linkedBannerImage ? (
                  <div className="relative">
                    <img src={linkedBannerImage} alt="Banner preview" className="w-full h-32 object-cover rounded" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); setLinkedBannerImage(""); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to upload banner image</span>
                  </div>
                )}
              </div>
              <input
                id="exp-linked-banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setLinkedBannerImage(url);
                  }
                  e.target.value = "";
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Redirect To</Label>
              <Select value={linkedRedirectPath} onValueChange={setLinkedRedirectPath}>
                <SelectTrigger><SelectValue placeholder="Where should this link to?" /></SelectTrigger>
                <SelectContent>
                  {REDIRECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.path} value={opt.path}>{opt.label}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom URL</SelectItem>
                </SelectContent>
              </Select>
              {linkedRedirectPath === "__custom__" && (
                <Input
                  placeholder="/custom-page or https://…"
                  value={linkedCustomRedirect}
                  onChange={e => setLinkedCustomRedirect(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </TabsContent>

          {/* Custom Experience Tab */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input placeholder="e.g. Heritage Coffee Trail" value={customHeading} onChange={e => setCustomHeading(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Subtext</Label>
              <Input placeholder="Short description shown below the heading" value={customSubtext} onChange={e => setCustomSubtext(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>CTA Button Label</Label>
              <Input placeholder="e.g. Explore, Book Now" value={customCtaLabel} onChange={e => setCustomCtaLabel(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div
                className="border-2 border-dashed border-input rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("exp-custom-banner-upload")?.click()}
              >
                {customBannerImage ? (
                  <div className="relative">
                    <img src={customBannerImage} alt="Banner preview" className="w-full h-32 object-cover rounded" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); setCustomBannerImage(""); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Click to upload banner image</span>
                  </div>
                )}
              </div>
              <input
                id="exp-custom-banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setCustomBannerImage(url);
                  }
                  e.target.value = "";
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Redirect To</Label>
              <Select value={customRedirectPath} onValueChange={setCustomRedirectPath}>
                <SelectTrigger><SelectValue placeholder="Where should this link to?" /></SelectTrigger>
                <SelectContent>
                  {REDIRECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.path} value={opt.path}>{opt.label}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom URL</SelectItem>
                </SelectContent>
              </Select>
              {customRedirectPath === "__custom__" && (
                <Input
                  placeholder="/custom-page or https://…"
                  value={customCustomRedirect}
                  onChange={e => setCustomCustomRedirect(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map(tag => (
                  <Badge
                    key={tag}
                    variant={customTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {customTags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Experience</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
