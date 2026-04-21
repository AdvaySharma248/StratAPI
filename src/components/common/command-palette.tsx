"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Globe,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  Search,
} from "lucide-react";
import { useAppStore, type PageId } from "@/lib/store";

const pages: { id: PageId; label: string; icon: React.ReactNode; keywords: string[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, keywords: ["home", "overview", "stats"] },
  { id: "apis", label: "APIs", icon: <Globe size={18} />, keywords: ["api", "management", "endpoints"] },
  { id: "api-keys", label: "API Keys", icon: <Key size={18} />, keywords: ["keys", "tokens", "credentials", "secret"] },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} />, keywords: ["charts", "metrics", "performance", "monitoring"] },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} />, keywords: ["payments", "invoices", "plans", "pricing", "subscription"] },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, keywords: ["config", "preferences", "profile"] },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setCurrentPage } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandOpen]);

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-border px-4">
                <Search size={16} className="shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex-1 h-12 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                {pages.map((page) => (
                  <Command.Item
                    key={page.id}
                    value={`${page.label} ${page.keywords.join(" ")}`}
                    onSelect={() => {
                      setCurrentPage(page.id);
                      setCommandOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">{page.icon}</span>
                    <span>{page.label}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
