"use client";

import {
  LayoutDashboard,
  Globe,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Eye,
  History,
  Users,
  Server,
  Activity,
} from "lucide-react";
import { useAppStore, type PageId } from "@/lib/store";
import { useAuth, type UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

type NavItem = { id: PageId; label: string; icon: React.ReactNode };

const ownerNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "apis", label: "APIs", icon: <Globe size={20} /> },
  { id: "api-keys", label: "API Keys", icon: <Key size={20} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

const consumerNav: NavItem[] = [
  { id: "overview", label: "Overview", icon: <Eye size={20} /> },
  { id: "my-api-keys", label: "My API Keys", icon: <Key size={20} /> },
  { id: "usage-history", label: "Usage History", icon: <History size={20} /> },
];

const adminNav: NavItem[] = [
  { id: "all-users", label: "All Users", icon: <Users size={20} /> },
  { id: "all-apis", label: "All APIs", icon: <Server size={20} /> },
  { id: "system-stats", label: "System Stats", icon: <Activity size={20} /> },
];

const navByRole: Record<UserRole, NavItem[]> = {
  owner: ownerNav,
  consumer: consumerNav,
  admin: adminNav,
};

export function Sidebar() {
  const { currentPage, sidebarCollapsed, setCurrentPage, toggleSidebar } = useAppStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const role = user?.role ?? "owner";
  const navItems = navByRole[role];

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "JD";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
        "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]",
        "max-lg:-translate-x-full max-lg:w-[260px]",
        mounted && !sidebarCollapsed && "max-lg:translate-x-0"
      )}
    >
      {mounted && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-[-1] bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Zap size={20} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold tracking-tight whitespace-nowrap">
            MeterFlow
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const button = (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              {item.icon}
              {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );

          if (sidebarCollapsed) {
            return (
              <TooltipProvider key={item.id} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="font-sans">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return button;
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-2 overflow-hidden",
          sidebarCollapsed && "justify-center px-0"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-xs text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="truncate text-sm font-medium">{user?.name ?? "User"}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="mt-2 hidden lg:flex w-full items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
