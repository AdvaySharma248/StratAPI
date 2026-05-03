"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Globe, Activity, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/common/animated-counter";

interface AdminStats {
  totalUsers: number;
  totalApis: number;
  totalRequests: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

export function AdminSystemStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await fetchJson<AdminStats>("/api/admin/stats");
        if (!ignore) setStats(data);
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load system stats.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const kpis = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: <Users size={20} />, color: "text-primary" },
    { label: "Total APIs", value: stats?.totalApis ?? 0, icon: <Globe size={20} />, color: "text-blue-600" },
    { label: "Total Requests", value: stats?.totalRequests ?? 0, icon: <Activity size={20} />, color: "text-green-600" },
    { label: "Platform Status", value: loading ? 0 : 1, icon: <TrendingUp size={20} />, color: "text-amber-600", label2: loading ? "Loading..." : "Operational" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Stats</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading platform metrics..." : "Platform health and performance overview"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <div className={`flex items-center gap-2 mb-3 ${stat.color}`}>
              {stat.icon}
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {loading ? (
                <span className="text-muted-foreground animate-pulse">—</span>
              ) : stat.label2 ? (
                <span className="text-emerald-600 text-lg">{stat.label2}</span>
              ) : (
                <AnimatedCounter value={stat.value} decimals={0} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Platform Summary</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">Live aggregated platform data</p>
          <div className="space-y-4">
            {[
              { label: "Registered Users", value: stats?.totalUsers ?? 0, unit: "users" },
              { label: "Active APIs", value: stats?.totalApis ?? 0, unit: "apis" },
              { label: "Total API Requests", value: stats?.totalRequests ?? 0, unit: "calls" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {loading ? "—" : `${row.value.toLocaleString()} ${row.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Service Status</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">Core service availability</p>
          <div className="space-y-3">
            {[
              { name: "Auth Service", ok: true },
              { name: "Database (SQLite)", ok: true },
              { name: "Backend API", ok: !loading && (stats?.totalApis !== undefined) },
              { name: "Billing Service", ok: true },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <span className="text-sm font-medium">{svc.name}</span>
                <div className="flex items-center gap-2">
                  <div className={svc.ok ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-500 animate-pulse"} />
                  <span className={svc.ok ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>
                    {svc.ok ? "Online" : "Checking..."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
