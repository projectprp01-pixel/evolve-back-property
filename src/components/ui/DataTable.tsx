import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface Action<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  className?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  actions,
  className 
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-soft overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, colIndex) => (
              <TableHead key={`${String(column.key)}-${colIndex}`} className="text-center">
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key)}
                    className="h-auto p-0 font-medium hover:bg-transparent w-full justify-center"
                  >
                    {column.title}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <span className="font-medium">{column.title}</span>
                )}
              </TableHead>
            ))}
            {actions && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              {columns.map((column, colIndex) => (
                <TableCell key={`${String(column.key)}-${colIndex}`} className="text-center">
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </TableCell>
              ))}
              {actions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action, actionIndex) => (
                        <DropdownMenuItem
                          key={actionIndex}
                          onClick={() => action.onClick(row)}
                          className={action.variant === "destructive" ? "text-danger" : ""}
                        >
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Status badge helper
export function StatusBadge({ 
  status, 
  variant 
}: { 
  status: string; 
  variant?: "default" | "accent" | "danger" | "success" 
}) {
  const variantStyles = {
    default: "bg-muted text-muted-foreground hover:bg-muted/80",
    accent: "bg-accent/10 text-accent border-accent/20 hover:bg-accent/15",
    danger: "bg-danger/10 text-danger border-danger/20 hover:bg-danger/15",
    success: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
  };

  return (
    <Badge className={cn("border min-w-[90px] justify-center text-center", variantStyles[variant || "default"])}>
      {status}
    </Badge>
  );
}