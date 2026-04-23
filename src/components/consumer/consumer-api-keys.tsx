"use client";

import { Badge } from "@/components/ui/badge";
import { apiKeys } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Consumer can only see their assigned keys (filtered)
const consumerKeys = apiKeys.filter(k => k.status === "active").slice(0, 3);

export function ConsumerApiKeysPage() {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const maskKey = (key: string) =>
    key.substring(0, 12) + "••••••••••••••••••••" + key.substring(key.length - 4);

  const copyKey = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      toast.success("Key copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My API Keys</h1>
        <p className="text-muted-foreground mt-1">API keys assigned to your account</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Key", "Name", "Usage", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consumerKeys.map((item) => (
                <tr key={item.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground max-w-[280px] truncate">
                        {revealed[item.id] ? item.key : maskKey(item.key)}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyKey(item.key, item.id)}>
                        {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setRevealed(p => ({ ...p, [item.id]: !p[item.id] }))}>
                        {revealed[item.id] ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{item.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono">{item.usage.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Active
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">Read-only</span>
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
