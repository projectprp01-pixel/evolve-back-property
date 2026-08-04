import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Treatment } from "./SpaTreatmentCard";

const LIMITS = {
  name: 40,
  description: 300,
} as const;

interface SpaTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment?: Treatment | null;
  onSave: (treatment: Partial<Treatment>) => void;
}

export function SpaTreatmentDialog({ open, onOpenChange, treatment, onSave }: SpaTreatmentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
  });

  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name,
        description: treatment.description,
        duration: treatment.duration,
        price: treatment.price,
      });
    } else {
      setFormData({ name: "", description: "", duration: 60, price: 0 });
    }
  }, [treatment, open]);

  const handleSave = () => {
    onSave({
      ...formData,
      id: treatment?.id || `treatment_${Date.now()}`,
      // preserve existing fields for backward compat
      category: treatment?.category || "Massage",
      forWhom: treatment?.forWhom || "Both",
      groupSize: treatment?.groupSize || "",
      image: treatment?.image || "",
      isActive: treatment?.isActive ?? true,
      wellnessBenefits: treatment?.wellnessBenefits || [],
      treatmentIncludes: treatment?.treatmentIncludes || [],
      guidelines: treatment?.guidelines || [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{treatment ? "Edit Treatment" : "Add Treatment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Treatment Name</Label>
            <Input
              value={formData.name}
              maxLength={LIMITS.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Abhyanga"
            />
            <p className="text-xs text-muted-foreground text-right">{formData.name.length}/{LIMITS.name}</p>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-xs text-muted-foreground">Detailed description shown to guests on the webapp</p>
            <Textarea
              value={formData.description}
              maxLength={LIMITS.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the treatment in detail..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{formData.description.length}/{LIMITS.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={e => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>{treatment ? "Update" : "Add Treatment"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
