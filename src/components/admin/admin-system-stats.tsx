"use client";

import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";

export function AdminSystemStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Stats</h1>
        <p className="text-muted-foreground mt-1">Platform health and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Users", value: 4821, gradient: "gradient-primary" },
          { label: "Total APIs", value: 156, gradient: "gradient-cyan" },
          { label: "Total Requests (24h)", value: 2847532, gradient: "gradient-success" },
          { label: "Avg Uptime", value: 99.96, suffix: "%", gradient: "gradient-warm" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-lg">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.suffix === "%" ? 2 : 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Health indicators */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">System Health</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">Core service status</p>
          <div className="space-y-3">
            {[
              { name: "API Gateway", status: "Operational", ok: true },
              { name: "Auth Service", status: "Operational", ok: true },
              { name: "Database", status: "Operational", ok: true },
              { name: "Queue Workers", status: "Operational", ok: true },
              { name: "CDN", status: "Operational", ok: true },
              { name: "Webhook Delivery", status: "Degraded", ok: false },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <span className="text-sm font-medium">{svc.name}</span>
                <div className="flex items-center gap-2">
                  <div className={svc.ok ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-500 animate-pulse"} />
                  <span className={svc.ok ? "text-xs text-emerald-600 dark:text-emerald-400" : "text-xs text-amber-600 dark:text-amber-400"}>
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Resource Usage</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">Current infrastructure metrics</p>
          <div className="space-y-4">
            {[
              { label: "CPU Usage", value: 34, color: "bg-chart-1" },
              { label: "Memory", value: 62, color: "bg-chart-2" },
              { label: "Disk I/O", value: 18, color: "bg-chart-3" },
              { label: "Network Bandwidth", value: 45, color: "bg-chart-4" },
            ].map((res) => (
              <div key={res.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{res.label}</span>
                  <span className="text-sm font-mono text-muted-foreground">{res.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", res.color)} style={{ width: `${res.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
