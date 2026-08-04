import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Upload, Camera } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVegetarian: boolean;
  isActive: boolean;
  preparationTime: string;
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  categories: string[];
  onSave: (item: Partial<MenuItem>) => void;
}

export function MenuItemDialog({ open, onOpenChange, item, categories, onSave }: MenuItemDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    isVegetarian: true,
    isActive: true,
    preparationTime: ""
  });
  
  const [imagePreview, setImagePreview] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        isVegetarian: item.isVegetarian,
        isActive: item.isActive,
        preparationTime: item.preparationTime
      });
      setImagePreview(item.image || "");
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        image: "",
        category: categories[0] || "",
        isVegetarian: true,
        isActive: true,
        preparationTime: ""
      });
      setImagePreview("");
    }
  }, [item, open, categories]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      // Add the new category to the list temporarily
      categories.push(newCategory.trim());
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
      setShowNewCategoryInput(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...formData,
      id: item?.id || `item_${Date.now()}`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Item Image</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Item preview"
                    className="w-32 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/30">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Recommended: 400x300px, JPG or PNG, max 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Paneer Tikka"
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.name.length}/40</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {!showNewCategoryInput ? (
                <div className="flex gap-2">
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      if (value === "add_new") {
                        setShowNewCategoryInput(true);
                      } else {
                        setFormData(prev => ({ ...prev, category: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-primary font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                    onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
                  />
                  <Button type="button" onClick={addNewCategory} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategory("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the menu item..."
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">{formData.description.length}/150</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preparationTime">Preparation Time</Label>
              <Input
                id="preparationTime"
                value={formData.preparationTime}
                onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: e.target.value }))}
                placeholder="e.g., 15-20 min"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.preparationTime.length}/20</p>
            </div>
          </div>




          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="isVegetarian">Vegetarian</Label>
                <Switch
                  id="isVegetarian"
                  checked={formData.isVegetarian}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegetarian: checked }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {item ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}