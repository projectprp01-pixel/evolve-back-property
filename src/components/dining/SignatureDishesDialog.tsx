import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureDish {
  id: string;
  name: string;
  description: string;
  price: number;
  isSignature: boolean;
}

interface DiningFacility {
  id: string;
  name: string;
  signatureDishes: SignatureDish[];
}

interface SignatureDishesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility?: DiningFacility | null;
  onSave: (facilityId: string, dishes: SignatureDish[]) => void;
}

export function SignatureDishesDialog({ open, onOpenChange, facility, onSave }: SignatureDishesDialogProps) {
  const { toast } = useToast();
  const [dishes, setDishes] = useState<SignatureDish[]>([]);
  const [editingDish, setEditingDish] = useState<SignatureDish | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    isSignature: true
  });

  useEffect(() => {
    if (facility) {
      setDishes(facility.signatureDishes || []);
    }
  }, [facility, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      isSignature: true
    });
    setEditingDish(null);
  };

  const handleAddDish = () => {
    setShowForm(true);
    resetForm();
  };

  const handleEditDish = (dish: SignatureDish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      isSignature: dish.isSignature
    });
    setShowForm(true);
  };

  const handleSaveDish = () => {
    if (!formData.name.trim() || !formData.description.trim() || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields with valid data",
        variant: "destructive"
      });
      return;
    }

    const dishData: SignatureDish = {
      id: editingDish?.id || `dish_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: formData.price,
      isSignature: formData.isSignature
    };

    if (editingDish) {
      setDishes(prev => prev.map(dish => dish.id === editingDish.id ? dishData : dish));
    } else {
      setDishes(prev => [...prev, dishData]);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDeleteDish = (dishId: string) => {
    setDishes(prev => prev.filter(dish => dish.id !== dishId));
  };

  const handleSaveAll = () => {
    if (facility) {
      onSave(facility.id, dishes);
      toast({
        title: "Success",
        description: "Signature dishes updated successfully"
      });
    }
    onOpenChange(false);
  };

  if (!facility) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            Manage Signature Dishes - {facility.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Form */}
          {showForm && (
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {editingDish ? "Edit Dish" : "Add New Signature Dish"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dishName">Dish Name</Label>
                    <Input
                      id="dishName"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Kerala Fish Curry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="850"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Traditional pork curry with authentic Kodava spices"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDish}>
                    {editingDish ? "Update Dish" : "Add Dish"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dishes List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Signature Dishes ({dishes.length})
              </h3>
              <Button onClick={handleAddDish} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Button>
            </div>

            {dishes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No signature dishes added yet</p>
                  <Button variant="outline" onClick={handleAddDish} className="mt-4">
                    Add First Dish
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {dishes.map((dish) => (
                  <Card key={dish.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{dish.name}</h4>
                            <Badge variant="accent" className="text-xs">
                              Signature
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {dish.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="font-bold text-lg">₹{dish.price}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDish(dish)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDish(dish.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Save All Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAll}>
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}