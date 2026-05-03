"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { statusPieData } from "@/lib/mock-data";

export interface StatusPiePoint {
  name: string;
  value: number;
  fill: string;
}

export function StatusPieChart({ data = statusPieData }: { data?: StatusPiePoint[] }) {
  const [mounted, setMounted] = useState(false);
  const chartData = data.length ? data : statusPieData;
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return <div className="h-[340px] w-full animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Success vs Errors</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Request status distribution</p>
      </div>
      <div className="flex items-center justify-center">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                  padding: "10px 14px",
                }}
                formatter={(value: number) => [`${value}%`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] w-full items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
            No requests yet
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Success</span>
          <span className="font-semibold">{chartData[0]?.value ?? 0}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Errors</span>
          <span className="font-semibold">{chartData[1]?.value ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}
