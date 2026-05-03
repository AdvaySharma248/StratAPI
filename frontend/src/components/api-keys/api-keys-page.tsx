"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy, Check, Eye, EyeOff, RotateCcw, Trash2, Plus, Key,
  Loader2, ShieldAlert, UserPlus, Share2, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendApi {
  _id?: string;
  id?: string;
  name: string;
}

interface ManagedApi {
  id: string;
  name: string;
}

interface BackendApiKey {
  id: string;
  apiId: string;
  keyPrefix: string;
  last4: string;
  usage?: number;
  status: string;
  assignedTo?: string | null;
  createdAt?: string;
}

interface ApiKey {
  id: string;
  apiId: string;
  keyPrefix: string;
  last4: string;
  fullKey?: string;
  apiName: string;
  assignedTo: string | null;   // consumer userId from backend
  assignedLabel: string;       // display label (username, stored locally)
  usage: number;
  status: string;
  created: string;
  revealed?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeApi(api: BackendApi): ManagedApi {
  return { id: String(api.id ?? api._id), name: api.name };
}

function normalizeApiKey(record: BackendApiKey, apiName: string, assignedLabel = "", fullKey?: string): ApiKey {
  return {
    id: record.id,
    apiId: record.apiId,
    keyPrefix: record.keyPrefix,
    last4: record.last4,
    fullKey,
    apiName,
    assignedTo: record.assignedTo ?? null,
    assignedLabel,
    usage: Number(record.usage ?? 0),
    status: record.status,
    created: record.createdAt ? record.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
    revealed: Boolean(fullKey),
  };
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message || body.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function maskKey(item: ApiKey) {
  if (item.fullKey) {
    return `${item.fullKey.substring(0, 12)}...${item.fullKey.substring(item.fullKey.length - 4)}`;
  }
  return `${item.keyPrefix}...${item.last4}`;
}

// LocalStorage label store (display purposes — username shown per key)
const LABELS_KEY = "sa_key_labels_v2";
function loadLabels(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LABELS_KEY) ?? "{}") as Record<string, string>; }
  catch { return {}; }
}
function saveLabel(keyId: string, label: string) {
  try {
    const current = loadLabels();
    current[keyId] = label;
    localStorage.setItem(LABELS_KEY, JSON.stringify(current));
  } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function APIKeysPage() {
  const [apis, setApis] = useState<ManagedApi[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<"generate" | "reveal" | "assign">("generate");
  const [selectedApiId, setSelectedApiId] = useState("");
  const [assignUsername, setAssignUsername] = useState("");
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [newlyGeneratedKeyId, setNewlyGeneratedKeyId] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingKeyId, setUpdatingKeyId] = useState<string | null>(null);

  const apiNameById = useMemo(() => new Map(apis.map((api) => [api.id, api.name])), [apis]);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadApisAndKeys = useCallback(async () => {
    setLoading(true);
    try {
      const apisRes = await fetch("/api/apis", { credentials: "include", cache: "no-store" });
      if (!apisRes.ok) throw new Error(await readApiError(apisRes));
      const apisData = (await apisRes.json()) as { items?: BackendApi[] };
      const nextApis = (apisData.items ?? []).map(normalizeApi);
      setApis(nextApis);
      setSelectedApiId((cur) => cur || nextApis[0]?.id || "");

      if (!nextApis.length) { setKeys([]); return; }

      const savedLabels = loadLabels();

      const keyGroups = await Promise.all(
        nextApis.map(async (api) => {
          const res = await fetch(`/api/apis/${encodeURIComponent(api.id)}/keys`, {
            credentials: "include", cache: "no-store",
          });
          if (!res.ok) return [];
          const data = (await res.json()) as { items?: BackendApiKey[] };
          return (data.items ?? []).map((k) =>
            normalizeApiKey(k, api.name, savedLabels[k.id] ?? "")
          );
        })
      );
      setKeys(keyGroups.flat());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadApisAndKeys(); }, [loadApisAndKeys]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const copyKey = async (item: ApiKey) => {
    if (!item.fullKey) {
      toast.error("Full key is only shown when it is first generated or rotated.");
      return;
    }
    try {
      await navigator.clipboard.writeText(item.fullKey);
      setCopiedId(item.id);
      toast.success("API key copied");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.error("Failed to copy"); }
  };

  const toggleReveal = (id: string) =>
    setKeys((cur) => cur.map((k) => k.id === id ? { ...k, revealed: !k.revealed } : k));

  const revokeKey = async (item: ApiKey) => {
    setUpdatingKeyId(item.id);
    try {
      const res = await fetch(
        `/api/apis/${encodeURIComponent(item.apiId)}/keys/${encodeURIComponent(item.id)}/revoke`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(await readApiError(res));
      setKeys((cur) => cur.map((k) => k.id === item.id ? { ...k, status: "revoked", revealed: false } : k));
      toast.success("API key revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke key.");
    } finally { setUpdatingKeyId(null); }
  };

  const rotateKey = async (item: ApiKey) => {
    setUpdatingKeyId(item.id);
    try {
      const res = await fetch(
        `/api/apis/${encodeURIComponent(item.apiId)}/keys/${encodeURIComponent(item.id)}/rotate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as { apiKey: BackendApiKey; plainTextKey: string };
      const savedLabels = loadLabels();
      const newKey = normalizeApiKey(
        data.apiKey,
        apiNameById.get(data.apiKey.apiId) || item.apiName,
        savedLabels[data.apiKey.id] ?? item.assignedLabel,
        data.plainTextKey
      );
      if (item.assignedLabel) saveLabel(data.apiKey.id, item.assignedLabel);
      setKeys((cur) => [
        newKey,
        ...cur.map((k) => k.id === item.id ? { ...k, status: "revoked", revealed: false } : k),
      ]);
      toast.success("Key rotated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to rotate key.");
    } finally { setUpdatingKeyId(null); }
  };

  const generateKey = async () => {
    if (!selectedApiId) { toast.error("Select an API first."); return; }
    setGenerating(true);
    try {
      const res = await fetch(`/api/apis/${encodeURIComponent(selectedApiId)}/keys`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as { apiKey: BackendApiKey; plainTextKey: string };
      const newKey = normalizeApiKey(data.apiKey, apiNameById.get(data.apiKey.apiId) || "API", "", data.plainTextKey);
      setKeys((cur) => [newKey, ...cur]);
      setNewlyGeneratedKey(data.plainTextKey);
      setNewlyGeneratedKeyId(data.apiKey.id);
      setDialogStep("reveal");
      toast.success("Key generated — copy it now!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate key.");
    } finally { setGenerating(false); }
  };

  const copyNewKey = async () => {
    if (!newlyGeneratedKey) return;
    try {
      await navigator.clipboard.writeText(newlyGeneratedKey);
      setNewKeyCopied(true);
      window.setTimeout(() => setNewKeyCopied(false), 2000);
      toast.success("Copied!");
    } catch { toast.error("Copy failed."); }
  };

  const assignKey = async () => {
    const username = assignUsername.trim().toLowerCase();
    if (!username || username.length < 3) {
      toast.error("Enter a valid username (3+ characters).");
      return;
    }
    if (!newlyGeneratedKeyId) {
      toast.error("No key to assign. Generate a key first.");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch("/api/apikey/assign", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId: newlyGeneratedKeyId, username }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as { message?: string; apiKey?: { assignedUsername?: string } };
      const assignedUsername = data.apiKey?.assignedUsername ?? username;
      // Persist label for display
      saveLabel(newlyGeneratedKeyId, `@${assignedUsername}`);
      // Update key in list
      setKeys((cur) => cur.map((k) => k.id === newlyGeneratedKeyId
        ? { ...k, assignedTo: "assigned", assignedLabel: `@${assignedUsername}` }
        : k
      ));
      setAssignResult(assignedUsername);
      setDialogStep("assign");
      toast.success(data.message ?? `Assigned to @${assignedUsername}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assignment failed.");
    } finally { setAssigning(false); }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setDialogStep("generate");
    setAssignUsername("");
    setNewlyGeneratedKey(null);
    setNewlyGeneratedKeyId(null);
    setNewKeyCopied(false);
    setAssignResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Generate and assign keys to consumers by username</p>
        </div>
        <Button onClick={() => { setDialogStep("generate"); setShowDialog(true); }} className="bg-primary text-white rounded-xl hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          New API Key
        </Button>
      </div>

      {/* How-to banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3 text-sm">
        <Share2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">How to assign a key to a consumer:</span>
          {" "}Click <span className="font-medium text-foreground">New API Key</span> → select your API → generate → copy the key → enter the consumer&apos;s username to assign it. The consumer will see the key in their dashboard.
        </span>
      </div>

      {/* Keys table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Key", "API", "Assigned To", "Usage", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-6 text-sm text-muted-foreground animate-pulse" colSpan={6}>Loading keys...</td></tr>
              ) : keys.length ? keys.map((item) => (
                <tr key={item.id} className="group border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground max-w-[220px] truncate">
                        {item.revealed && item.fullKey ? item.fullKey : maskKey(item)}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyKey(item)} title="Copy">
                        {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleReveal(item.id)} disabled={!item.fullKey} title="Toggle reveal">
                        {item.revealed ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><Key size={13} className="text-muted-foreground" /><span className="text-sm font-medium">{item.apiName}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    {item.assignedLabel ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <UserCheck size={13} className="text-blue-500" />
                        <span className="font-medium text-foreground">{item.assignedLabel}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-mono">{item.usage.toLocaleString()}</span></td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border-0",
                      item.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {item.status === "active" ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => rotateKey(item)} disabled={updatingKeyId === item.id}>
                          {updatingKeyId === item.id ? <Loader2 size={13} className="mr-1 animate-spin" /> : <RotateCcw size={13} className="mr-1" />}
                          Rotate
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                          onClick={() => revokeKey(item)} disabled={updatingKeyId === item.id}>
                          <Trash2 size={13} className="mr-1" />Revoke
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  No keys yet. Click <span className="font-medium text-foreground">New API Key</span> to create one.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Dialog ─────────────────────────────────────────────────────────── */}
      {showDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={dialogStep === "generate" ? closeDialog : undefined} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-2xl">

            {/* Step 1: Select API */}
            {dialogStep === "generate" && (
              <>
                <h2 className="text-lg font-semibold">Generate New API Key</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Select an API to generate a new key. You can assign it to a consumer in the next step.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="gen-api-select">API <span className="text-destructive">*</span></label>
                  <Select value={selectedApiId} onValueChange={setSelectedApiId}>
                    <SelectTrigger id="gen-api-select" className="h-10 rounded-xl">
                      <SelectValue placeholder="Select API" />
                    </SelectTrigger>
                    <SelectContent>
                      {apis.map((api) => <SelectItem key={api.id} value={api.id}>{api.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" className="rounded-xl" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={generateKey} disabled={generating || !selectedApiId} className="bg-primary text-white rounded-xl">
                    {generating ? <><Loader2 size={14} className="mr-2 animate-spin" />Generating...</> : <><Plus size={14} className="mr-2" />Generate Key</>}
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Copy the key */}
            {dialogStep === "reveal" && (
              <>
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <ShieldAlert size={18} />
                  <h2 className="text-lg font-semibold text-foreground">Save Your API Key</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This is the <span className="font-semibold text-foreground">only time</span> the full key is shown. Copy it now.
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                  <code className="flex-1 break-all text-xs font-mono text-foreground select-all">{newlyGeneratedKey}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyNewKey}>
                    {newKeyCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} className="text-muted-foreground" />}
                  </Button>
                </div>
                <Button onClick={copyNewKey} variant="outline" className="mt-3 w-full rounded-xl border-amber-500/40 text-sm">
                  {newKeyCopied ? <><Check size={14} className="mr-2 text-emerald-500" />Copied!</> : <><Copy size={14} className="mr-2" />Copy Key</>}
                </Button>

                {/* Assign section */}
                <div className="mt-5 border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-primary" />
                    <span className="text-sm font-medium">Assign to Consumer</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                  <input
                    type="text"
                    value={assignUsername}
                    onChange={(e) => setAssignUsername(e.target.value)}
                    placeholder="Enter consumer username (e.g. john_dev)"
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    The consumer must have a StratAPI account. Their username is shown at registration.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={closeDialog}>
                      Done (skip assign)
                    </Button>
                    <Button className="flex-1 bg-primary text-white rounded-xl" onClick={assignKey} disabled={assigning || !assignUsername.trim()}>
                      {assigning ? <><Loader2 size={13} className="mr-1 animate-spin" />Assigning...</> : <><UserCheck size={14} className="mr-1" />Assign</>}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Confirm assignment */}
            {dialogStep === "assign" && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <UserCheck size={20} />
                  <h2 className="text-lg font-semibold text-foreground">Key Assigned!</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  The API key has been assigned to <span className="font-semibold text-foreground">@{assignResult}</span>. They will see it in their consumer dashboard.
                </p>
                <Button onClick={closeDialog} className="w-full rounded-xl bg-primary text-white">Done</Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
