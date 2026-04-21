"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, RotateCcw, Trash2, Plus, Key } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiKeys as initialKeys } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: number;
  key: string;
  name: string;
  usage: number;
  status: string;
  created: string;
  revealed?: boolean;
}

export function APIKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys.map(k => ({ ...k, revealed: false })));
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "••••••••••••••••••••" + key.substring(key.length - 4);
  };

  const copyKey = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const toggleReveal = (id: number) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, revealed: !k.revealed } : k));
  };

  const revokeKey = (id: number) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" } : k));
    toast.success("API key revoked");
  };

  const rotateKey = (id: number) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const newKey = "mf_live_sk_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setKeys(prev => prev.map(k => k.id === id ? { ...k, key: newKey, revealed: false } : k));
    toast.success("API key rotated successfully");
  };

  const generateKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const newKey: ApiKey = {
      id: Date.now(),
      key: "mf_live_sk_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""),
      name: `New API Key ${keys.length + 1}`,
      usage: 0,
      status: "active",
      created: new Date().toISOString().split("T")[0],
      revealed: true,
    };
    setKeys(prev => [newKey, ...prev]);
    setShowDialog(false);
    toast.success("New API key generated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage your API keys and access credentials</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gradient-primary text-white rounded-xl glow-shadow-sm hover:opacity-90 transition-opacity">
          <Plus size={16} className="mr-2" />
          Generate API Key
        </Button>
      </div>

      {/* Keys table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Key", "API Name", "Usage", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((item) => (
                <tr
                  key={item.id}
                  className="group border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground max-w-[280px] truncate">
                        {item.revealed ? item.key : maskKey(item.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyKey(item.key, item.id)}
                      >
                        {copiedId === item.id ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} className="text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => toggleReveal(item.id)}
                      >
                        {item.revealed ? (
                          <EyeOff size={14} className="text-muted-foreground" />
                        ) : (
                          <Eye size={14} className="text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Key size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono">{item.usage.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                        item.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}
                    >
                      {item.status === "active" ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => rotateKey(item.id)}
                        >
                          <RotateCcw size={13} className="mr-1" />
                          Rotate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                          onClick={() => revokeKey(item.id)}
                        >
                          <Trash2 size={13} className="mr-1" />
                          Revoke
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Dialog */}
      {showDialog && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Generate New API Key</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A new API key will be created with full access to your APIs.
              Make sure to save it — you won&apos;t be able to see it again.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={generateKey}
                className="gradient-primary text-white rounded-xl"
              >
                Generate Key
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
