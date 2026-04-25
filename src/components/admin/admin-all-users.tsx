"use client";

import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";
import { Shield, Users, Globe, CheckCircle, XCircle } from "lucide-react";

const allUsers = [
  { id: 1, name: "John Doe", email: "john@meterflow.io", role: "owner" as const, status: "active", apis: 6 },
  { id: 2, name: "Alice Smith", email: "alice@company.com", role: "consumer" as const, status: "active", apis: 2 },
  { id: 3, name: "Bob Wilson", email: "bob@startup.io", role: "owner" as const, status: "active", apis: 4 },
  { id: 4, name: "Carol Davis", email: "carol@dev.com", role: "consumer" as const, status: "inactive", apis: 0 },
  { id: 5, name: "Dan Brown", email: "dan@enterprise.com", role: "admin" as const, status: "active", apis: 0 },
  { id: 6, name: "Eve Chen", email: "eve@platform.io", role: "consumer" as const, status: "active", apis: 1 },
  { id: 7, name: "Frank Lee", email: "frank@saas.com", role: "owner" as const, status: "active", apis: 3 },
  { id: 8, name: "Grace Kim", email: "grace@tech.io", role: "consumer" as const, status: "active", apis: 2 },
];

const roleBadge: Record<string, string> = {
  owner: "bg-red-500/10 text-red-600",
  consumer: "bg-blue-500/10 text-blue-600",
  admin: "bg-amber-500/10 text-amber-600",
};

export function AdminAllUsersPage() {
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.status === "active").length;
  const owners = allUsers.filter(u => u.role === "owner").length;
  const consumers = allUsers.filter(u => u.role === "consumer").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users and roles</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", value: totalUsers, icon: <Users size={18} /> },
          { label: "Active", value: activeUsers, icon: <CheckCircle size={18} /> },
          { label: "Owners", value: owners, icon: <Shield size={18} /> },
          { label: "Consumers", value: consumers, icon: <Globe size={18} /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <span className="text-2xl font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["User", "Role", "APIs", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <div>
                      <span className="text-sm font-medium">{u.name}</span>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border-0 uppercase tracking-wider", roleBadge[u.role])}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm">{u.apis}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      u.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-red-500/10 text-red-600"
                    )}>
                      {u.status === "active" ? "Active" : "Inactive"}
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
