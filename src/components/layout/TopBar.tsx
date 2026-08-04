import { Bell, Check, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProperty } from "@/context/PropertyContext";
import { useAuth } from "@/context/AuthContext";

export function TopBar({ onLogout }: { onLogout?: () => void }) {
  const { selectedProperty, setSelectedProperty, properties } = useProperty();
  const { staff } = useAuth();

  const initials = staff
    ? `${staff.firstName[0] ?? ""}${staff.lastName[0] ?? ""}`.toUpperCase()
    : "EB";
  const displayName = staff ? `${staff.firstName} ${staff.lastName}` : "";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-soft">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />

        {/* Property Switcher */}
        {staff?.role === 'Admin' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProperty.themeColor }}></div>
                  <span className="font-medium">{selectedProperty.name}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 z-50 bg-popover">
              {properties.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => setSelectedProperty(p)} className="cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.themeColor }}></div>
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      {p.rooms > 0 && <div className="text-xs text-muted-foreground">{p.rooms} rooms</div>}
                    </div>
                    {p.id === selectedProperty.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium bg-card">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProperty.themeColor }} />
            <span>{selectedProperty.name}</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 py-1">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
              {displayName && (
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium leading-tight">{displayName}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{staff?.role}</div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 z-50 bg-popover shadow-lg border border-border">
            <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
