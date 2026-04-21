"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex min-h-screen flex-col"
      >
        <TopNavbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
