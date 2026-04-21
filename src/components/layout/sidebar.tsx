"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAppStore, type PageId } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "apis", label: "APIs", icon: <Globe size={20} /> },
  { id: "api-keys", label: "API Keys", icon: <Key size={20} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export function Sidebar() {
  const { currentPage, sidebarCollapsed, setCurrentPage, toggleSidebar, setSidebarCollapsed } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary">
          <Zap size={20} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="text-lg font-semibold tracking-tight"
          >
            MeterFlow
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const button = (
            <motion.button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl gradient-primary"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </span>
            </motion.button>
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
        {/* User profile */}
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-2 py-2",
          sidebarCollapsed && "justify-center px-0"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="gradient-primary text-xs text-white font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="truncate text-sm font-medium">John Doe</span>
              <span className="truncate text-xs text-sidebar-foreground/60">john@meterflow.io</span>
            </motion.div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setSidebarCollapsed(true);
            } else {
              toggleSidebar();
            }
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
