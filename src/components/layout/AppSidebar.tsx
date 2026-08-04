import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Activity,
  Coffee,
  Sparkles,
  Car,
  MessageSquare,
  UserCheck,
  Star,
  FileText,
  Users,
  CreditCard,
  Image,
  Settings,
  BarChart2,
  ContactRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { ROLE_ACCESS, type StaffRole } from "@/components/staff/roles";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Experience Hub", url: "/activities", icon: Activity },
  { title: "F&B Hub", url: "/fnb", icon: Coffee },
  { title: "Spa Hub", url: "/spa", icon: Sparkles },
  { title: "Transport Hub", url: "/transport", icon: Car },
  { title: "Comms Hub", url: "/comms", icon: MessageSquare },
  { title: "Check-in Hub", url: "/checkin", icon: UserCheck },
  { title: "Guest Management", url: "/guests", icon: ContactRound },
  { title: "Analytics", url: "/analytics", icon: BarChart2 },
  { title: "Staff Management", url: "/staff", icon: Users },
  { title: "App Banners", url: "/assets", icon: Image },
  { title: "Property Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { staff } = useAuth();

  const allowedSections = staff ? (ROLE_ACCESS[staff.role as StaffRole] ?? []) : [];
  const visibleItems = navigationItems.filter((item) => allowedSections.includes(item.title));

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-foreground/10 text-sidebar-foreground font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-sidebar-foreground"
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground text-sidebar-foreground/60 border-l-[3px] border-transparent";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="bg-sidebar">
        {/* LUME Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {!collapsed && (
              <div>
                <div className="text-sidebar-foreground font-impact text-lg tracking-wide">LUME</div>
                <div className="text-sidebar-foreground/70 text-xs">Effortless Experiences. Intelligent Operations.</div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 p-4">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-smooth ${getNavClasses(item.url)}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
