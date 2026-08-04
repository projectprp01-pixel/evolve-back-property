import { useState } from "react";
import { useProperty } from "@/context/PropertyContext";
import { ArrowLeft, Plus, Eye, EyeOff, ChevronUp, ChevronDown, Tag, Trash2, ExternalLink, Link2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI, type AppBanner } from "@/services/api";
import { useWriteAccess } from "@/hooks/useWriteAccess";
import AddBannerDialog, { type HeroBannerItem } from "@/components/banners/AddBannerDialog";
import { LoadingBar } from "@/components/ui/LoadingBar";

function appBannerToItem(b: AppBanner): HeroBannerItem {
  return {
    id: b._id,
    type: b.isCustom ? "custom" : "linked",
    linkedItemId: b.actionValue ?? undefined,
    actionType: (b.actionType as HeroBannerItem["actionType"]) ?? undefined,
    heading: b.title,
    subtext: b.description ?? "",
    ctaLabel: b.buttonText ?? "Learn More",
    bannerImage: b.imageUrl ?? "",
    redirectPath: "",
    tags: b.tags ?? [],
    displayOrder: b.priority ?? 0,
    isVisible: b.isActive,
  };
}

function itemToAppBannerPayload(item: Omit<HeroBannerItem, "id" | "displayOrder" | "isVisible">, propertyId: string): Record<string, unknown> {
  const isPageLink = item.linkedItemId?.startsWith("/");
  return {
    title: item.heading,
    description: item.subtext || undefined,
    imageUrl: item.bannerImage || "https://placehold.co/800x400?text=Banner",
    bannerType: "home-carousel",
    targetApp: "guest-portal",
    actionType: isPageLink ? "link" : (item.actionType ?? "experience"),
    actionValue: item.linkedItemId,
    buttonText: item.ctaLabel || "Learn More",
    propertyId,
    isActive: true,
    priority: 0,
    tags: item.tags ?? [],
    isCustom: false,
  };
}

export default function HeroBanner() {
  const { selectedProperty } = useProperty();
  const queryClient = useQueryClient();
  const canWrite = useWriteAccess();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners", selectedProperty.id],
    queryFn: () => dashboardAPI.getAllBanners({ propertyId: selectedProperty.id, isActive: true }),
  });

  // Prefetch dropdown data so AddBannerDialog opens instantly
  useQuery({ queryKey: ['experiences', selectedProperty.id], queryFn: () => dashboardAPI.getAllExperiences(selectedProperty.id), staleTime: 5 * 60_000 });
  useQuery({ queryKey: ['dashboard-spa', selectedProperty.id], queryFn: () => dashboardAPI.getAllSpaFacilities(selectedProperty.id), staleTime: 5 * 60_000 });
  useQuery({ queryKey: ['dashboard-restaurants', selectedProperty.id], queryFn: () => dashboardAPI.getAllRestaurants(selectedProperty.id), staleTime: 5 * 60_000 });

  const apiBanners = banners.map(appBannerToItem);
  const heroBannerItems = apiBanners.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<HeroBannerItem | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => dashboardAPI.createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setShowDialog(false);
      toast.success("Banner added to Hero Banner");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to add banner"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => dashboardAPI.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner updated");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to update banner"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardAPI.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Item removed from Hero Banner");
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to delete banner"),
  });

  const handleAddBanner = (data: Omit<HeroBannerItem, "id" | "displayOrder" | "isVisible">) => {
    const payload = itemToAppBannerPayload(data, selectedProperty.id);
    payload.priority = heroBannerItems.length;
    createMutation.mutate(payload);
  };

  const handleToggleVisibility = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !current } });
  };

  const handleMoveItem = (id: string, direction: "up" | "down") => {
    const idx = heroBannerItems.findIndex((item) => item.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= heroBannerItems.length) return;
    const a = heroBannerItems[idx];
    const b = heroBannerItems[targetIdx];
    updateMutation.mutate({ id: a.id, data: { priority: targetIdx } });
    updateMutation.mutate({ id: b.id, data: { priority: idx } });
  };

  const handleRemoveItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  const busy = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const busyLabel = isLoading ? "Loading banners…" : createMutation.isPending ? "Adding banner…" : updateMutation.isPending ? "Saving changes…" : deleteMutation.isPending ? "Removing…" : "";

  return (
    <div className="space-y-6">
      <LoadingBar loading={busy} label={busyLabel} />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <NavLink to="/assets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to App Banners
          </NavLink>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Hero Banner Management</h1>
          <p className="text-muted-foreground">Link existing items or create custom banners</p>
        </div>
        {canWrite && (
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        )}
      </div>

      <AddBannerDialog
        open={showDialog}
        onOpenChange={(v) => { setShowDialog(v); if (!v) setEditingItem(null); }}
        onSubmit={handleAddBanner}
        editItem={editingItem}
        onUpdate={(data) => {
          if (editingItem) {
            const payload = itemToAppBannerPayload(data, selectedProperty.id);
            payload.priority = editingItem.displayOrder;
            payload.isActive = editingItem.isVisible;
            updateMutation.mutate({ id: editingItem.id, data: payload });
            setEditingItem(null);
            setShowDialog(false);
          }
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Hero Banner Items ({heroBannerItems.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage experiences displayed in the hero section of your app
          </p>
        </CardHeader>
        <CardContent>
          {heroBannerItems.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No hero banner items added yet</p>
              <p className="text-sm text-muted-foreground">Click "Add Banner" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {heroBannerItems.map((item, index) => (
                <Card key={item.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {item.bannerImage && (
                        <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.bannerImage}
                            alt={item.heading}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            #{item.displayOrder + 1}
                          </Badge>
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
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                          <Badge variant="outline" className="text-xs">
                            CTA: {item.ctaLabel}
                          </Badge>
                          {item.redirectPath && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Redirects to: <code className="bg-muted px-1 rounded">{item.redirectPath}</code>
                            </span>
                          )}
                          {item.tags.length > 0 && (
                            <div className="flex gap-1">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingItem(item); setShowDialog(true); }}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleVisibility(item.id, item.isVisible)}
                          >
                            {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <div className="flex flex-col">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveItem(item.id, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveItem(item.id, "down")}
                              disabled={index === heroBannerItems.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
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
