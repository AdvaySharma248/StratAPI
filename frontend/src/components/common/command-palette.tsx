"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  Search,
  Eye,
  History,
  Users,
  Server,
  Activity,
} from "lucide-react";
import { useAppStore, type PageId } from "@/lib/store";
import { useAuth, type UserRole, rolePages } from "@/lib/auth";
import { getPageRoute } from "@/lib/page-routes";

const allPageItems: { id: PageId; label: string; icon: React.ReactNode; keywords: string[]; role: UserRole }[] = [
  // Owner
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, keywords: ["home", "overview", "stats"], role: "owner" },
  { id: "apis", label: "APIs", icon: <Globe size={18} />, keywords: ["api", "management", "endpoints"], role: "owner" },
  { id: "api-keys", label: "API Keys", icon: <Key size={18} />, keywords: ["keys", "tokens", "credentials"], role: "owner" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} />, keywords: ["charts", "metrics", "performance"], role: "owner" },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} />, keywords: ["payments", "invoices", "plans"], role: "owner" },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, keywords: ["config", "preferences", "profile"], role: "owner" },
  // Consumer
  { id: "overview", label: "Overview", icon: <Eye size={18} />, keywords: ["home", "dashboard", "summary"], role: "consumer" },
  { id: "my-api-keys", label: "My API Keys", icon: <Key size={18} />, keywords: ["keys", "tokens", "assigned"], role: "consumer" },
  { id: "usage-history", label: "Usage History", icon: <History size={18} />, keywords: ["logs", "activity", "requests"], role: "consumer" },
  // Admin
  { id: "all-users", label: "All Users", icon: <Users size={18} />, keywords: ["users", "accounts", "people"], role: "admin" },
  { id: "all-apis", label: "All APIs", icon: <Server size={18} />, keywords: ["api", "services", "endpoints"], role: "admin" },
  { id: "system-stats", label: "System Stats", icon: <Activity size={18} />, keywords: ["health", "monitoring", "metrics", "performance"], role: "admin" },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen, setCurrentPage } = useAppStore();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "owner";

  const roleItems = useMemo(
    () => allPageItems.filter((p) => p.role === role),
    [role]
  );

  const filtered = useMemo(
    () =>
      query
        ? roleItems.filter(
            (p) =>
              p.label.toLowerCase().includes(query.toLowerCase()) ||
              p.keywords.some((k) => k.includes(query.toLowerCase()))
          )
        : roleItems,
    [query, roleItems]
  );

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
    router.push(getPageRoute(id));
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
        <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
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
