"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { CalendarDays, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyticsData } from "@/lib/mock-data";

export function AnalyticsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedApi, setSelectedApi] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const textColor = isDark ? "#64748B" : "#94A3B8";

  const tooltipStyle = {
    backgroundColor: isDark ? "#2b0000" : "#FFFFFF",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
    borderRadius: "12px",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
    fontSize: "13px",
    padding: "10px 14px",
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/30" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[340px] animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your API performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedApi} onValueChange={setSelectedApi}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All APIs</SelectItem>
              <SelectItem value="payment">Payment Gateway</SelectItem>
              <SelectItem value="auth">Auth Service</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] h-9 rounded-xl text-sm">
              <CalendarDays size={14} className="mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests per minute */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Requests Per Minute</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time request throughput</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={analyticsData.requestsPerMinute} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? "#22D3EE" : "#06B6D4"} stopOpacity={0.2} />
                <stop offset="100%" stopColor={isDark ? "#22D3EE" : "#06B6D4"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="requests" stroke={isDark ? "#22D3EE" : "#06B6D4"} strokeWidth={2} fill="url(#rpmGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Latency */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Latency Distribution</h3>
            <p className="text-sm text-muted-foreground mt-0.5">P50, P95, P99 response times (ms)</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={analyticsData.latency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? "#818CF8" : "#6366F1"} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={isDark ? "#818CF8" : "#6366F1"} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? "#A78BFA" : "#8B5CF6"} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={isDark ? "#A78BFA" : "#8B5CF6"} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="p99Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? "#F472B6" : "#EC4899"} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={isDark ? "#F472B6" : "#EC4899"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} unit="ms" />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Area type="monotone" dataKey="p50" stroke={isDark ? "#818CF8" : "#6366F1"} strokeWidth={2} fill="url(#p50Grad)" dot={false} />
              <Area type="monotone" dataKey="p95" stroke={isDark ? "#A78BFA" : "#8B5CF6"} strokeWidth={2} fill="url(#p95Grad)" dot={false} />
              <Area type="monotone" dataKey="p99" stroke={isDark ? "#F472B6" : "#EC4899"} strokeWidth={2} fill="url(#p99Grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Error Rate</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Weekly error rate percentage</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analyticsData.errorRate} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} tickMargin={8} unit="%" />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="rate"
                fill={isDark ? "#F87171" : "#EF4444"}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
