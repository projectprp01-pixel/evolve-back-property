import { useState } from "react";
import { Edit, Trash2, UtensilsCrossed, Wine, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface DiningFacility {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cuisineType: string;
  hours: string;
  image: string;
  isActive: boolean;
  facilityType?: "restaurant" | "intimate_dining";
  price?: number;
  pricingLabel?: string;
  mealTimes?: string[];
  [key: string]: any;
}

interface DiningFacilityCardProps {
  facility: DiningFacility;
  onEdit?: (facility: DiningFacility) => void;
  onDelete?: (id: string) => void;
}

export function DiningFacilityCard({ facility, onEdit, onDelete }: DiningFacilityCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const type = facility.facilityType || "restaurant";
  const isRestaurant = type === "restaurant";

  return (
    <>
      <div className="group relative rounded-xl overflow-hidden shadow-soft hover:shadow-lg transition-shadow border border-border bg-card">
        {/* Image area */}
        <div className="relative h-44 w-full overflow-hidden">
          {facility.image ? (
            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/40">{facility.name.charAt(0)}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Type badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-xs border-0 gap-1">
              {isRestaurant ? <UtensilsCrossed className="h-3 w-3" /> : <Wine className="h-3 w-3" />}
              {isRestaurant ? "Restaurant" : "Intimate Dining"}
            </Badge>
          </div>

          {/* Status dot */}
          <div className="absolute top-3 left-3">
            <div className={`h-2.5 w-2.5 rounded-full ${facility.isActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-muted-foreground/50"}`} />
          </div>

          {/* Name on image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-md">{facility.name}</h3>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{facility.subtitle}</p>

          {/* Restaurant details */}
          {isRestaurant && facility.cuisineType && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
              <span>{facility.cuisineType}</span>
            </div>
          )}
          {isRestaurant && facility.mealTimes && facility.mealTimes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Serves</p>
              <div className="flex flex-wrap gap-1.5">
                {facility.mealTimes.map((meal: string) => (
                  <Badge key={meal} variant="secondary" className="text-[11px] font-normal capitalize">
                    {meal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Intimate Dining details */}
          {!isRestaurant && (
            <div className="space-y-2">
              {facility.maxGuests && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{facility.maxGuests} guests per table</span>
                </div>
              )}
              {facility.tablesPerNight && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wine className="h-3.5 w-3.5 shrink-0" />
                  <span>{facility.tablesPerNight} tables per night</span>
                </div>
              )}
              {facility.price && facility.price > 0 && (
                <div className="pt-1">
                  <p className="text-base font-semibold">₹{facility.price.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">{facility.pricingLabel}</span></p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              {onEdit && (
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => onEdit(facility)}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="flex-1 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{facility.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the facility from the guest app. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onDelete?.(facility.id); setConfirmDelete(false); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
