import { useState } from "react";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScheduleOffPopover } from "@/components/ui/ScheduleOffPopover";

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
  ingredients: string[];
  blackoutDates?: Date[];
}

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onScheduleOff?: (id: string, dates: Date[]) => void;
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleStatus, onScheduleOff }: MenuItemCardProps) {
  return (
    <Card className="shadow-soft hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {item.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    item.isVegetarian ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <h3 className="font-semibold text-base">{item.name}</h3>
                {!item.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              
              {onScheduleOff && (
                <ScheduleOffPopover
                  blackoutDates={item.blackoutDates || []}
                  onDatesChange={(dates) => onScheduleOff(item.id, dates)}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Item
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(item.id)}>
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">₹{item.price}</span>
                {item.preparationTime && (
                  <span className="text-xs text-muted-foreground">
                    ~{item.preparationTime}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>

            {item.ingredients.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {item.ingredients.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}