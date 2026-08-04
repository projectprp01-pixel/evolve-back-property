import { useState } from "react";
import { useProperty } from "@/context/PropertyContext";
import { ArrowLeft, Plus, Eye, EyeOff, ChevronUp, ChevronDown, Tag, Trash2, ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI, type Experience } from "@/services/api";
import { useWriteAccess } from "@/hooks/useWriteAccess";
import AddExperienceDialog, { type CraftedExperienceItem } from "@/components/banners/AddExperienceDialog";

function experienceToItem(e: Experience): CraftedExperienceItem {
  return {
    id: e._id,
    type: "linked",
    heading: e.title,
    subtext: e.shortDescription ?? "",
    ctaLabel: "Explore",
    bannerImage: e.imageUrl ?? "",
    redirectPath: "/activities",
    tags: e.tags ?? [],
    displayOrder: e.craftedOrder ?? 0,
    isVisible: e.isActive !== false,
  };
}

export default function CraftedExperience() {
  const { selectedProperty } = useProperty();
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();
  const [showDialog, setShowDialog] = useState(false);

  const { data: allExperiences = [], isLoading } = useQuery({
    queryKey: ["experiences", selectedProperty.id],
    queryFn: () => dashboardAPI.getAllExperiences(selectedProperty.id),
  });

  const items = allExperiences
    .filter((e) => e.isCrafted)
    .map(experienceToItem)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Experience>) => dashboardAPI.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      setShowDialog(false);
      toast.success("Experience added to Crafted Experiences");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to add"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Experience> }) => dashboardAPI.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      toast.success("Experience updated");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      toast.success("Experience removed");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to delete"),
  });

  const handleAddExperience = (data: Omit<CraftedExperienceItem, "id" | "displayOrder" | "isVisible">) => {
    createMutation.mutate({
      title: data.heading,
      shortDescription: data.subtext,
      imageUrl: data.bannerImage || "https://placehold.co/800x400?text=Experience",
      isCrafted: true,
      craftedOrder: items.length,
      isActive: true,
      propertyId: selectedProperty.id,
      category: "cultural",
      fullDescription: data.subtext,
      images: [],
      duration: { value: 60, unit: "minutes" },
      pricing: { basePrice: 0, currency: "INR", pricePerPerson: false },
      groupSize: { min: 1, max: 10 },
      inclusions: [],
      exclusions: [],
      tags: data.tags,
    });
  };

  const handleToggleVisibility = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !current } });
  };

  const handleMoveItem = (id: string, direction: "up" | "down") => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const a = items[idx];
    const b = items[targetIdx];
    updateMutation.mutate({ id: a.id, data: { craftedOrder: targetIdx } });
    updateMutation.mutate({ id: b.id, data: { craftedOrder: idx } });
  };

  const handleRemoveItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <NavLink to="/assets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to App Banners
          </NavLink>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Crafted Experience Management</h1>
          <p className="text-muted-foreground">Create and manage curated experiences for guests</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowDialog(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        )}
      </div>

      <AddExperienceDialog open={showDialog} onOpenChange={setShowDialog} onSubmit={handleAddExperience} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Crafted Experiences ({items.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage curated experiences displayed in the app
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No crafted experiences added yet</p>
              <p className="text-sm text-muted-foreground">Click "Add Experience" or mark experiences as Crafted in Activities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={item.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {item.bannerImage && (
                        <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img src={item.bannerImage} alt={item.heading} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">#{item.displayOrder + 1}</Badge>
                          <h3 className="font-semibold">{item.heading}</h3>
                          {item.type === "linked" ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Link2 className="h-3 w-3" /> Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                          {!item.isVisible && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{item.subtext}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="text-xs">CTA: {item.ctaLabel}</Badge>
                          {item.redirectPath && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              <code className="bg-muted px-1 rounded">{item.redirectPath}</code>
                            </span>
                          )}
                          {item.tags.length > 0 && (
                            <div className="flex gap-1">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleToggleVisibility(item.id, item.isVisible)}>
                            {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <div className="flex flex-col">
                            <Button size="sm" variant="ghost" onClick={() => handleMoveItem(item.id, "up")} disabled={index === 0}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleMoveItem(item.id, "down")} disabled={index === items.length - 1}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
