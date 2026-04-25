"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { recentActivity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ActivityTable() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 pb-4">
        <h3 className="text-base font-semibold">Recent API Activity</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Latest API requests across all services</p>
      </div>
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
            {recentActivity.map((item) => (
              <tr key={item.id} className="border-t border-border/50 transition-colors hover:bg-muted/50">
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium">{item.apiName}</span>
                </td>
                <td className="px-6 py-3.5">
                  <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                    {item.endpoint}
                  </code>
                </td>
                <td className="px-6 py-3.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      item.status === "success"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    )}
                  >
                    {item.status === "success" ? "Success" : "Error"}
                  </Badge>
                </td>
                <td className="px-6 py-3.5">
                  <span className={cn(
                    "text-sm font-mono",
                    item.latency > 1000
                      ? "text-red-500"
                      : item.latency > 500
                        ? "text-amber-500"
                        : "text-foreground"
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
  );
}
