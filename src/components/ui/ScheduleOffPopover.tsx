import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleOffPopoverProps {
  blackoutDates: Date[];
  onDatesChange: (dates: Date[]) => void;
}

export function ScheduleOffPopover({ blackoutDates, onDatesChange }: ScheduleOffPopoverProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <CalendarX2 className="h-4 w-4" />
          {blackoutDates.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {blackoutDates.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Schedule Off Dates</p>
            {blackoutDates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDatesChange([])}
              >
                Clear All
              </Button>
            )}
          </div>
          <Calendar
            mode="multiple"
            selected={blackoutDates}
            onSelect={(dates) => onDatesChange(dates || [])}
            disabled={(date) => date < today}
            className={cn("pointer-events-auto")}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
