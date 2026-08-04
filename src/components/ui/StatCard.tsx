import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "accent" | "danger";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    accent: "border-accent/20 bg-accent/5",
    danger: "border-danger/20 bg-danger/5"
  };

  return (
    <Card className={cn("shadow-soft transition-smooth hover:shadow-medium", variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          variant === "accent" && "text-accent",
          variant === "danger" && "text-danger",
          variant === "default" && "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.isPositive ? "text-green-600" : "text-red-500"}>
              {trend.isPositive ? "↑" : "↓"} {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            {" "}from yesterday
          </p>
        )}
      </CardContent>
    </Card>
  );
}