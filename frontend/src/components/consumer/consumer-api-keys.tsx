"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Copy, Check, Eye, EyeOff, Key, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignedKey {
  id: string;
  apiId: string;
  keyPrefix: string;
  last4: string;
  key?: string;
  plainTextKey?: string | null;
  usage: number;
  status: string;
  assignedTo?: string | null;
  createdAt?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? "Request failed.");
  }
  return response.json() as Promise<T>;
}

function maskKey(prefix: string, last4: string) {
  return `${prefix}••••••••••••${last4}`;
}

export function ConsumerApiKeysPage() {
  const [keys, setKeys] = useState<AssignedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        // Use the dedicated consumer endpoint — returns only keys assigned to this user's email
        const { items = [] } = await fetchJson<{ items?: AssignedKey[] }>("/api/consumer/keys");
        if (!ignore) setKeys(items);
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load your API keys.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

  const copyKey = async (key: AssignedKey) => {
    const fullKey = key.plainTextKey ?? key.key ?? null;
    if (fullKey) {
      try {
        await navigator.clipboard.writeText(fullKey);
        setCopiedId(key.id);
        toast.success("API key copied!");
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast.error("Unable to copy.");
      }
    } else {
      // Legacy key created before plainTextKey was stored — only prefix available
      const masked = maskKey(key.keyPrefix, key.last4);
      try {
        await navigator.clipboard.writeText(masked);
        setCopiedId(key.id);
        toast.info("Key prefix copied. Ask your API owner to re-generate a new key so the full value is available.");
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast.error("Unable to copy.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My API Keys</h1>
        <p className="text-muted-foreground mt-1">
          {loading
            ? "Loading your assigned API keys..."
            : `${keys.length} key${keys.length !== 1 ? "s" : ""} assigned to your account`}
        </p>
      </div>

      {/* Info notice */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3 text-sm">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Read-only access.</span>
          {" "}Keys are assigned to you by the API owner. You can copy your full key using the copy button. Contact your API owner to generate new keys or revoke existing ones.
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Key (masked)", "Usage", "Status", "Assigned", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((item) => (
                <tr key={item.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Key size={13} className="text-muted-foreground shrink-0" />
                      <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground max-w-[240px] truncate">
                        {revealed[item.id] && (item.plainTextKey ?? item.key)
                          ? (item.plainTextKey ?? item.key)
                          : maskKey(item.keyPrefix, item.last4)}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono">{(item.usage ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      item.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {item.status === "active" ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyKey(item)}
                        title={item.plainTextKey ?? item.key ? "Copy full API key" : "Copy key prefix"}
                      >
                        {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </Button>
                      {(item.plainTextKey ?? item.key) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setRevealed((p) => ({ ...p, [item.id]: !p[item.id] }))}
                          title={revealed[item.id] ? "Hide key" : "Reveal full key"}
                        >
                          {revealed[item.id] ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && keys.length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={5}>
                    No API keys assigned to your account yet. Ask your API owner to generate and assign a key using your email address.
                  </td>
                </tr>
              )}
              {loading && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground animate-pulse" colSpan={5}>
                    Loading your assigned keys...
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
