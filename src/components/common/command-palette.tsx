"use client";

import { useEffect, useState, useRef } from "react";
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
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? pages.filter(
        (p) =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          p.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : pages;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandOpen]);

  useEffect(() => {
    if (commandOpen) {
      const id = requestAnimationFrame(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [commandOpen]);

  const handleSelect = (id: PageId) => {
    setCurrentPage(id);
    setCommandOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].id);
      }
    }
  };

  if (!commandOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setCommandOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-border px-4">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 h-12 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}
            {filtered.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  idx === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-muted-foreground">{page.icon}</span>
                <span>{page.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
