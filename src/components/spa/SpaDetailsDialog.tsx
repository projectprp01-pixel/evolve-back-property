import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Camera, X } from "lucide-react";

export interface SpaDetails {
  propertyName: string;
  name: string;
  subtitle: string;
  description: string;
  ctaButtonText: string;
  hours: string;
  location: string;
  contact: string;
  howToReach: string;
  coverImage: string;
  policies: string;
}

const LIMITS = {
  name: 40,
  subtitle: 60,
  description: 300,
  ctaButtonText: 30,
  policies: 500,
} as const;

interface SpaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: SpaDetails;
  onSave: (details: SpaDetails) => void;
}

export function SpaDetailsDialog({ open, onOpenChange, details, onSave }: SpaDetailsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SpaDetails>(details);
  const [imagePreview, setImagePreview] = useState(details.coverImage);

  useEffect(() => {
    setFormData(details);
    setImagePreview(details.coverImage);
  }, [details, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, coverImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Spa Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Cover" className="w-32 h-24 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => { setImagePreview(""); setFormData(prev => ({ ...prev, coverImage: "" })); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/30">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload className="h-4 w-4 mr-2" /> {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Spa Name</Label>
              <Input value={formData.name} maxLength={LIMITS.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              <p className="text-xs text-muted-foreground text-right">{formData.name.length}/{LIMITS.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={formData.subtitle} maxLength={LIMITS.subtitle} onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} />
              <p className="text-xs text-muted-foreground text-right">{formData.subtitle.length}/{LIMITS.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-xs text-muted-foreground">This text appears on the guest app card (e.g., "Ancient healing, timeless rejuvenation…")</p>
            <Textarea value={formData.description} maxLength={LIMITS.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            <p className="text-xs text-muted-foreground text-right">{formData.description.length}/{LIMITS.description}</p>
          </div>

          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Input value={formData.ctaButtonText} maxLength={LIMITS.ctaButtonText} onChange={e => setFormData(prev => ({ ...prev, ctaButtonText: e.target.value }))} placeholder="e.g., EXPLORE VAIDYASALA" />
            <p className="text-xs text-muted-foreground text-right">{formData.ctaButtonText.length}/{LIMITS.ctaButtonText}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Opening Time</Label>
              <Select value={formData.hours.split(" - ")[0] || ""} onValueChange={(val) => {
                const closing = formData.hours.split(" - ")[1] || "8:00 PM";
                setFormData(prev => ({ ...prev, hours: `${val} - ${closing}` }));
              }}>
                <SelectTrigger className="bg-popover">
                  <SelectValue placeholder="Select opening time" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {["6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Closing Time</Label>
              <Select value={formData.hours.split(" - ")[1] || ""} onValueChange={(val) => {
                const opening = formData.hours.split(" - ")[0] || "9:00 AM";
                setFormData(prev => ({ ...prev, hours: `${opening} - ${val}` }));
              }}>
                <SelectTrigger className="bg-popover">
                  <SelectValue placeholder="Select closing time" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {["12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM","9:30 PM","10:00 PM","10:30 PM","11:00 PM"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>




          <div className="space-y-2">
            <Label>Wellness Guidelines and Policies</Label>
            <p className="text-xs text-muted-foreground">Enter each guideline on a new line. They will appear as bullet points on the guest app.</p>
            <Textarea value={formData.policies} maxLength={LIMITS.policies} onChange={e => setFormData(prev => ({ ...prev, policies: e.target.value }))} rows={5} placeholder={"Arrive 15 minutes early for consultation\nAvoid heavy meals 2 hours before treatment\nInform therapist of any health conditions\nWear comfortable, loose clothing\nFree cancellation up to 4 hours prior\nPhotography not permitted in spa areas"} />
            <p className="text-xs text-muted-foreground text-right">{formData.policies.length}/{LIMITS.policies}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
