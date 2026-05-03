"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // Default: sidebar expanded on desktop, no margin on mobile
          mounted
            ? (sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")
            : "lg:ml-[260px]"
        )}
      >
        <TopNavbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
