"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiList } from "@/lib/mock-data";

export function AdminAllApisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All APIs</h1>
        <p className="text-muted-foreground mt-1">Platform-wide API registry</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["API Name", "Base URL", "Requests", "Uptime", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apiList.map((api) => (
                <tr key={api.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium">{api.name}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <code className="text-xs font-mono text-muted-foreground">{api.baseUrl}</code>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-mono">{api.requests.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm">{api.uptime}%</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium border-0 uppercase tracking-wider",
                        api.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {api.status}
                    </Badge>
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
