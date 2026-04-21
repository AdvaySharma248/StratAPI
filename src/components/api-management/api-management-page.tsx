"use client";

import { Globe, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function APIManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">APIs</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your API services</p>
        </div>
        <Button className="gradient-primary text-white rounded-xl glow-shadow-sm hover:opacity-90 transition-opacity">
          <Plus size={16} className="mr-2" />
          Create API
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apiList.map((api) => (
          <div
            key={api.id}
            className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Globe size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{api.name}</h3>
                  <code className="text-xs text-muted-foreground">{api.baseUrl}</code>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium border-0 uppercase tracking-wider",
                  api.status === "healthy"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}
              >
                {api.status}
              </Badge>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-lg font-semibold tracking-tight mt-0.5">
                  {api.requests.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: <span className="text-foreground font-medium">{api.uptime}%</span>
                </p>
              </div>
              <MiniSparkline
                data={api.sparkline}
                color={api.status === "healthy" ? "#10B981" : "#F59E0B"}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground">
                View Details
                <ExternalLink size={12} className="ml-1" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground">
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
