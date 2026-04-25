"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { recentActivity } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

export function ConsumerUsageHistoryPage() {
  const usageData = recentActivity.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage History</h1>
        <p className="text-muted-foreground mt-1">Your recent API request activity</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                {["API Name", "Endpoint", "Status", "Latency", "Timestamp"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usageData.map((item) => (
                <tr key={item.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium">{item.apiName}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <code className="rounded-lg bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {item.endpoint}
                    </code>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                        item.status === "success"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      )}
                    >
                      {item.status === "success" ? "Success" : "Error"}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
