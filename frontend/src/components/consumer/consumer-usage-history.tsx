"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

export function ConsumerUsageHistoryPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const { items = [] } = await fetchJson<{ items?: UsageLog[] }>("/api/usage-logs?limit=200");

        if (!ignore) {
          const successes = items.filter((l) => l.statusCode < 400).length;
          const errors = items.filter((l) => l.statusCode >= 400).length;
          setLogs(items);
          setSuccessCount(successes);
          setErrorCount(errors);
        }
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load usage history.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage History</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading your request history..." : `${logs.length} request${logs.length !== 1 ? "s" : ""} recorded`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Calls", value: logs.length, color: "text-foreground" },
          { label: "Successful", value: successCount, color: "text-emerald-600" },
          { label: "Errors", value: errorCount, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1", s.color)}>
              {loading ? <span className="animate-pulse">—</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Endpoint", "Method", "Status", "Latency", "Timestamp"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((item, i) => (
                <tr key={item.id ?? item._id ?? i} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <code className="rounded-lg bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {item.endpoint}
                    </code>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-semibold">{item.method}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      item.statusCode >= 400 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {item.statusCode}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={cn(
                      "text-sm font-mono",
                      item.latency > 1000 ? "text-red-500" : item.latency > 500 ? "text-amber-500" : "text-foreground"
                    )}>
                      {item.latency}ms
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                    No API calls recorded yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground animate-pulse" colSpan={5}>
                    Loading usage history...
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
