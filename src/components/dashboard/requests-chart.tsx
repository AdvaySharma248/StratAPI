"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { requestsChartData } from "@/lib/mock-data";

export function RequestsChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return <div className="h-[340px] w-full animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">API Requests Over Time</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Daily request volume</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Requests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="text-muted-foreground">Errors</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={requestsChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} tickMargin={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} tickMargin={8} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : v} />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              fontSize: "13px",
              padding: "10px 14px",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Area type="monotone" dataKey="requests" stroke="#DC2626" strokeWidth={2} fill="url(#requestGradient)" dot={false} activeDot={{ r: 4, stroke: "#DC2626", strokeWidth: 2, fill: "#FFFFFF" }} />
          <Area type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={1.5} fill="url(#errorGradient)" dot={false} strokeDasharray="4 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
