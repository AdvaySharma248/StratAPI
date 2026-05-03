"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BackendApi {
  _id?: string;
  id?: string;
  name: string;
  baseUrl?: string;
  upstreamUrl?: string;
  requests?: number;
  usageLogCount?: number;
  isActive?: boolean;
  status?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

export function AdminAllApisPage() {
  const [apis, setApis] = useState<BackendApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const { items = [] } = await fetchJson<{ items?: BackendApi[] }>("/api/apis");
        if (!ignore) setApis(items);
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load APIs.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const totalRequests = apis.reduce((sum, api) => sum + Number(api.requests ?? api.usageLogCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All APIs</h1>
        <p className="text-muted-foreground mt-1">
          {loading
            ? "Loading platform APIs..."
            : `${apis.length} API${apis.length !== 1 ? "s" : ""} · ${totalRequests.toLocaleString()} total requests`}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["API Name", "Base URL", "Requests", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => {
                const apiId = String(api.id ?? api._id ?? "");
                const isActive = api.isActive !== false && (api.status !== "inactive");
                const requests = Number(api.requests ?? api.usageLogCount ?? 0);
                const baseUrl = api.baseUrl ?? api.upstreamUrl ?? "—";

                return (
                  <tr key={apiId} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-medium">{api.name}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <code className="text-xs font-mono text-muted-foreground truncate max-w-[240px] block">{baseUrl}</code>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-mono">{requests.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="secondary" className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium border-0 uppercase tracking-wider",
                        isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      )}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {!loading && apis.length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground" colSpan={4}>
                    No APIs registered on this platform yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground animate-pulse" colSpan={4}>
                    Loading APIs...
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
