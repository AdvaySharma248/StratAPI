"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, Users, Globe, CheckCircle } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "consumer" | "admin";
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  owner: "bg-red-500/10 text-red-600",
  consumer: "bg-blue-500/10 text-blue-600",
  admin: "bg-amber-500/10 text-amber-600",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

export function AdminAllUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const { users: data = [] } = await fetchJson<{ users?: AdminUser[] }>("/api/admin/users");
        if (!ignore) setUsers(data);
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load users.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const owners = users.filter((u) => u.role === "owner").length;
  const consumers = users.filter((u) => u.role === "consumer").length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading platform users..." : `${users.length} registered user${users.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", value: users.length, icon: <Users size={18} /> },
          { label: "Owners", value: owners, icon: <Shield size={18} /> },
          { label: "Consumers", value: consumers, icon: <Globe size={18} /> },
          { label: "Admins", value: admins, icon: <CheckCircle size={18} /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <span className="text-2xl font-bold">
              {loading ? <span className="animate-pulse text-muted-foreground">—</span> : s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["User", "Role", "Joined"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <div>
                      <span className="text-sm font-medium">{u.name}</span>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0 uppercase tracking-wider",
                      roleBadge[u.role]
                    )}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground" colSpan={3}>
                    No platform users found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground animate-pulse" colSpan={3}>
                    Loading users...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
