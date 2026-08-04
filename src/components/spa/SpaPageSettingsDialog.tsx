import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, X } from "lucide-react";

export interface SpaPageSettings {
  name: string;
  subtitle: string;
  description: string;
  coverImage: string;
}

const LIMITS = { name: 40, subtitle: 80, description: 300 } as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SpaPageSettings;
  onSave: (s: SpaPageSettings) => void;
}

export function SpaPageSettingsDialog({ open, onOpenChange, settings, onSave }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<SpaPageSettings>(settings);
  const [preview, setPreview] = useState(settings.coverImage);

  useEffect(() => {
    setForm(settings);
    setPreview(settings.coverImage);
  }, [settings, open]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const r = ev.target?.result as string;
        setPreview(r);
        setForm(p => ({ ...p, coverImage: r }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Spa Page Settings</DialogTitle>
          <DialogDescription>Configure the spa landing page content shown to guests</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Spa Image</Label>
            <div className="flex items-start gap-4">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Spa" className="w-32 h-24 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => { setPreview(""); setForm(p => ({ ...p, coverImage: "" })); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/30">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
                  <Upload className="h-4 w-4 mr-2" /> {preview ? "Change" : "Upload"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 800×600px</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Spa Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} maxLength={LIMITS.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Vaidyashala" />
            <p className="text-xs text-muted-foreground text-right">{form.name.length}/{LIMITS.name}</p>
          </div>

          <div className="space-y-2">
            <Label>Spa Subtitle</Label>
            <Input value={form.subtitle} maxLength={LIMITS.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g., Ayurvedic Spa & Wellness" />
            <p className="text-xs text-muted-foreground text-right">{form.subtitle.length}/{LIMITS.subtitle}</p>
          </div>

          <div className="space-y-2">
            <Label>Spa Description</Label>
            <Textarea value={form.description} maxLength={LIMITS.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe your spa..." />
            <p className="text-xs text-muted-foreground text-right">{form.description.length}/{LIMITS.description}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onSave(form); onOpenChange(false); }} disabled={!form.name.trim()}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
