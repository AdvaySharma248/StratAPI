"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Key, AlertTriangle, Zap, AtSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";

interface UsageLog {
  _id?: string;
  id?: string;
  apiId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latency: number;
  timestamp: string;
}


interface OverviewData {
  totalRequests: number;
  activeKeys: number;
  errorRate: number;
  recentActivity: UsageLog[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

export function ConsumerOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [{ items: logs = [] }] = await Promise.all([
          fetchJson<{ items?: UsageLog[] }>("/api/usage-logs?limit=100"),
        ]);

        // Fetch keys assigned to this consumer
        let activeKeys = 0;
        try {
          const { items: assignedKeys = [] } = await fetchJson<{ items?: Array<{ status: string }> }>("/api/consumer/keys");
          activeKeys = assignedKeys.filter((k) => k.status === "active").length;
        } catch {
          // Non-critical
        }

        const errors = logs.filter((l) => l.statusCode >= 400).length;
        const errorRate = logs.length ? Number(((errors / logs.length) * 100).toFixed(1)) : 0;

        if (!ignore) {
          setData({
            totalRequests: logs.length,
            activeKeys,
            errorRate,
            recentActivity: logs.slice(0, 5),
          });
        }
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load overview.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const kpis = [
    { label: "My Requests", value: data?.totalRequests ?? 0, icon: <Activity size={16} />, color: "text-primary" },
    { label: "Active API Keys", value: data?.activeKeys ?? 0, icon: <Key size={16} />, color: "text-blue-600" },
    { label: "Error Rate", value: `${data?.errorRate ?? 0}%`, icon: <AlertTriangle size={16} />, color: "text-amber-600" },
    { label: "Avg Latency", value: data ? (data.recentActivity.length ? `${Math.round(data.recentActivity.reduce((s, l) => s + l.latency, 0) / data.recentActivity.length)}ms` : "—") : "—", icon: <Zap size={16} />, color: "text-emerald-600" },
  ];

  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading your usage data..." : "Your API usage at a glance"}
        </p>
        {user?.username && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-sm">
            <AtSign size={13} className="text-blue-500" />
            <span className="font-medium text-foreground">{user.username}</span>
            <span className="text-muted-foreground">— share this username with API owners to receive keys</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5">
            <div className={cn("flex items-center gap-2 mb-2", kpi.color)}>
              {kpi.icon}
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {loading ? <span className="text-muted-foreground animate-pulse">—</span> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold">Recent API Calls</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Your latest 5 requests</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                {["Endpoint", "Method", "Status", "Latency", "Time"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentActivity ?? []).map((log, i) => (
                <tr key={log.id ?? log._id ?? i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                      {log.endpoint}
                    </code>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-semibold">{log.method}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      log.statusCode >= 400 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {log.statusCode}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={cn("text-sm font-mono", log.latency > 1000 ? "text-red-500" : log.latency > 500 ? "text-amber-500" : "text-foreground")}>
                      {log.latency}ms
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && (data?.recentActivity ?? []).length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                    No API calls recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
