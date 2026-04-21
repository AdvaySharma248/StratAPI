"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useTheme } from "next-themes";
import { statusPieData } from "@/lib/mock-data";

export function StatusPieChart() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[340px] w-full animate-pulse rounded-2xl bg-muted/30" />
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Success vs Errors</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Request status distribution</p>
      </div>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusPieData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {statusPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
                borderRadius: "12px",
                boxShadow: isDark
                  ? "0 4px 20px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: "13px",
                padding: "10px 14px",
              }}
              formatter={(value: number) => [`${value}%`, undefined]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Success</span>
          <span className="font-semibold">97.58%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Errors</span>
          <span className="font-semibold">2.42%</span>
        </div>
      </div>
    </div>
  );
}
