import { Edit, MoreVertical, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScheduleOffPopover } from "@/components/ui/ScheduleOffPopover";

export interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  forWhom: "Singles" | "Couples" | "Both";
  groupSize: string;
  image: string;
  isActive: boolean;
  wellnessBenefits: string[];
  treatmentIncludes: string[];
  guidelines: string[];
  blackoutDates?: Date[];
}

interface SpaTreatmentCardProps {
  treatment: Treatment;
  onEdit: (treatment: Treatment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onScheduleOff?: (id: string, dates: Date[]) => void;
}

export function SpaTreatmentCard({ treatment, onEdit, onDelete, onToggleStatus, onScheduleOff }: SpaTreatmentCardProps) {
  return (
    <Card className="shadow-soft hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{treatment.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{treatment.description}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2">
              <Clock className="h-3 w-3" /> {treatment.duration} min
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <span className="font-bold text-lg">₹{treatment.price.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground">per person</p>
            </div>
            <div className="flex items-center gap-1">
              <Switch checked={treatment.isActive} onCheckedChange={() => onToggleStatus(treatment.id)} />
              {onScheduleOff && (
                <ScheduleOffPopover
                  blackoutDates={treatment.blackoutDates || []}
                  onDatesChange={(dates) => onScheduleOff(treatment.id, dates)}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(treatment)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(treatment.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
