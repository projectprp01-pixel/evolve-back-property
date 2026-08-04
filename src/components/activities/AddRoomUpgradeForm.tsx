import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RoomUpgradeFormData {
  // Basic Details
  title: string;
  subtitle: string;
  description: string;
  images: File[];
  
  // Pricing
  originalPrice: number;
  upgradePrice: number;
  currency: string;
  availability: string;
  
  // Stay Details
  currentRoomType: string;
  upgradeRoomType: string;
  
  // Benefits
  benefits: Array<{
    icon: string;
    title: string;
    description?: string;
  }>;
  
  // Additional Details
  pricePerNight: boolean;
  totalNights: number;
}

interface AddRoomUpgradeFormProps {
  onSubmit: (data: RoomUpgradeFormData) => void;
  onCancel: () => void;
}

export default function AddRoomUpgradeForm({ onSubmit, onCancel }: AddRoomUpgradeFormProps) {
  const [formData, setFormData] = useState<RoomUpgradeFormData>({
    title: "",
    subtitle: "",
    description: "",
    images: [],
    originalPrice: 0,
    upgradePrice: 0,
    currency: "₹",
    availability: "",
    currentRoomType: "",
    upgradeRoomType: "",
    benefits: [],
    pricePerNight: true,
    totalNights: 2,
  });

  const [newBenefit, setNewBenefit] = useState({ icon: "", title: "", description: "" });

  const handleInputChange = (field: keyof RoomUpgradeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (newBenefit.title.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, { ...newBenefit }]
      }));
      setNewBenefit({ icon: "", title: "", description: "" });
      toast.success("Benefit added");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.upgradeRoomType || !formData.upgradePrice) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Upgrade Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Room Upgrade"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="subtitle">Room Type *</Label>
            <Input
              id="subtitle"
              placeholder="e.g., Deluxe Cottage"
              value={formData.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="upgradeRoomType">Upgrade to Room Type *</Label>
            <Input
              id="upgradeRoomType"
              placeholder="e.g., Deluxe Cottage"
              value={formData.upgradeRoomType}
              onChange={(e) => handleInputChange("upgradeRoomType", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="currentRoomType">Current Room Type</Label>
            <Input
              id="currentRoomType"
              placeholder="e.g., Superior Cottage"
              value={formData.currentRoomType}
              onChange={(e) => handleInputChange("currentRoomType", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Private balcony overlooking the forest canopy"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Room Images</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple images to showcase the upgraded room
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click to upload room images
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalPrice">Original Price</Label>
              <div className="flex">
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-16"
                />
                <Input
                  type="number"
                  id="originalPrice"
                  placeholder="5500"
                  value={formData.originalPrice || ""}
                  onChange={(e) => handleInputChange("originalPrice", parseFloat(e.target.value) || 0)}
                  className="flex-1 ml-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upgradePrice">Upgrade Price *</Label>
              <div className="flex">
                <Input
                  value={formData.currency}
                  readOnly
                  className="w-16"
                />
                <Input
                  type="number"
                  id="upgradePrice"
                  placeholder="4200"
                  value={formData.upgradePrice || ""}
                  onChange={(e) => handleInputChange("upgradePrice", parseFloat(e.target.value) || 0)}
                  className="flex-1 ml-2"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="availability">Availability Message</Label>
            <Input
              id="availability"
              placeholder="e.g., Only 3 cottages left!"
              value={formData.availability}
              onChange={(e) => handleInputChange("availability", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Benefits</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add benefits that come with this room upgrade
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Icon (emoji or text)"
                value={newBenefit.icon}
                onChange={(e) => setNewBenefit(prev => ({ ...prev, icon: e.target.value }))}
              />
              <Input
                placeholder="Benefit title"
                value={newBenefit.title}
                onChange={(e) => setNewBenefit(prev => ({ ...prev, title: e.target.value }))}
              />
              <Button onClick={addBenefit} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {formData.benefits.length > 0 && (
            <div className="space-y-2">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{benefit.icon}</span>
                    <span className="font-medium">{benefit.title}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => removeBenefit(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Create Room Upgrade
        </Button>
      </div>
    </div>
  );
}