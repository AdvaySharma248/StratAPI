"use client";

import { Check, ArrowUpRight, Download, Zap, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { billingData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function BillingPage() {
  const usagePercent = Math.round((billingData.usage.requests / billingData.usage.limit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and view invoices</p>
      </div>

      {/* Current Plan */}
      <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-card p-6">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-primary" />
                <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 text-primary text-xs">
                  Current Plan
                </Badge>
              </div>
              <h2 className="mt-3 text-2xl font-bold">
                {billingData.currentPlan.name}
                <span className="ml-2 text-lg font-normal text-muted-foreground">
                  ${billingData.currentPlan.price}/mo
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {billingData.currentPlan.requests} API requests per month
              </p>
            </div>
            <Button className="bg-primary text-white rounded-xl hover:bg-primary/90 transition-opacity shrink-0">
              <Rocket size={16} className="mr-2" />
              Upgrade Plan
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {billingData.currentPlan.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-primary shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage + Plans grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Usage summary */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Usage This Month</h3>
          <p className="text-sm text-muted-foreground mt-0.5">API request consumption</p>

          <div className="mt-6">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {(billingData.usage.requests / 1000).toFixed(1)}K
              </span>
              <span className="text-sm text-muted-foreground">
                of {(billingData.usage.limit / 1000).toFixed(0)}K
              </span>
            </div>
            <Progress value={usagePercent} className="mt-3 h-2.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              {usagePercent}% of monthly quota used
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated cost this month</span>
              <span className="text-lg font-semibold">${billingData.usage.cost}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on current usage at ${((billingData.usage.cost / billingData.usage.requests) * 1000).toFixed(2)}/1K requests
            </p>
          </div>
        </div>

        {/* All plans */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Available Plans</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Choose the plan that fits your needs</p>

          <div className="mt-5 space-y-3">
            {billingData.plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-colors",
                  plan.current
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    plan.current ? "bg-primary text-white" : "bg-muted"
                  )}>
                    <Zap size={18} className={plan.current ? "text-white" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      {plan.current && (
                        <Badge className="h-5 rounded-full bg-primary/10 text-primary border-0 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {plan.requests} requests/mo
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">${plan.price}</span>
                  {!plan.current && (
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ArrowUpRight size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold">Invoices</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Your billing history</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                {["Invoice", "Date", "Amount", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billingData.invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="group border-t border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium font-mono">{inv.id}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-muted-foreground">{inv.date}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-semibold">${inv.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium border-0 bg-emerald-500/10 text-emerald-600"
                    >
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground">
                      <Download size={13} className="mr-1" />
                      PDF
                    </Button>
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
