"use client";

import { Badge } from "@/components/ui/badge";
import { kpiData, recentActivity, apiKeys } from "@/lib/mock-data";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";

// Consumer gets a filtered subset
const consumerKpi = [
  { ...kpiData[0], title: "My Requests" },
  { ...kpiData[1], title: "API Keys", value: 4 },
  { ...kpiData[2] },
];

const consumerActivity = recentActivity.slice(0, 5);
const consumerKeys = apiKeys.filter(k => k.status === "active").slice(0, 3);

export function ConsumerOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your API usage at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {consumerKpi.map((kpi) => (
          <div
            key={kpi.title}
            className="rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-lg"
          >
            <p className="text-sm text-muted-foreground">{kpi.title}</p>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              <AnimatedCounter value={kpi.value} suffix={kpi.suffix} decimals={kpi.suffix === "%" ? 2 : 0} />
            </div>
          </div>
        ))}
      </div>

      {/* Assigned API Keys */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Assigned API Keys</h3>
        <p className="text-sm text-muted-foreground mt-0.5 mb-4">Keys available for your use</p>
        <div className="space-y-3">
          {consumerKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
              <div className="flex items-center gap-3">
                <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground">
                  {key.key.substring(0, 16)}••••••••
                </code>
                <span className="text-sm font-medium">{key.name}</span>
              </div>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
