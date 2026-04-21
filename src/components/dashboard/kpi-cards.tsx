"use client";

import { Activity, Key, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";
import { kpiData } from "@/lib/mock-data";

const iconMap: Record<string, React.ReactNode> = {
  Activity: <Activity size={22} />,
  Key: <Key size={22} />,
  AlertTriangle: <AlertTriangle size={22} />,
  DollarSign: <DollarSign size={22} />,
};

export function KPICards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiData.map((kpi, idx) => (
        <div
          key={kpi.title}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          {/* Subtle gradient overlay */}
          <div className={cn(
            "absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12]",
            kpi.gradient
          )} />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-white",
                kpi.gradient
              )}>
                {iconMap[kpi.icon]}
              </div>
              <div className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                kpi.trend === "up"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              )}>
                {kpi.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                <AnimatedCounter
                  value={kpi.value}
                  prefix={kpi.prefix}
                  suffix={kpi.suffix}
                  decimals={kpi.suffix === "%" ? 2 : 0}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
