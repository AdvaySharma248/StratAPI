"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ApiStatus = "Not Tested" | "Healthy" | "Unhealthy";

interface BackendApi {
  _id?: string;
  id?: string;
  name: string;
  baseUrl: string;
  requests?: number;
  usageLogCount?: number;
  status?: string;
  uptime?: number;
  sparkline?: number[];
  lastStatusCode?: number | null;
  lastRequestAt?: string | null;
  upstreamHeaders?: string[];
}

interface ManagedApi {
  id: string;
  name: string;
  baseUrl: string;
  requests: number;
  status: ApiStatus;
  uptime: number;
  sparkline: number[];
  lastStatusCode: number | null;
  lastRequestAt: string | null;
  upstreamHeaderKeys: string[];
}

const backendGatewayBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");

function buildGatewayRequestUrl(targetUrl: string) {
  return `${backendGatewayBaseUrl}/gateway?url=${encodeURIComponent(targetUrl)}`;
}

function normalizeStatus(status?: string): ApiStatus {
  const normalizedStatus = status?.trim().toLowerCase();

  if (normalizedStatus === "healthy") {
    return "Healthy";
  }

  if (normalizedStatus === "unhealthy") {
    return "Unhealthy";
  }

  return "Not Tested";
}

function getStatusClasses(status: ApiStatus) {
  if (status === "Healthy") {
    return "bg-emerald-500/10 text-emerald-600";
  }

  if (status === "Unhealthy") {
    return "bg-red-500/10 text-red-600";
  }

  return "bg-amber-500/10 text-amber-600";
}

function normalizeApi(api: BackendApi): ManagedApi {
  const requests = Number(api.requests ?? api.usageLogCount ?? 0);
  const status = normalizeStatus(api.status);
  const sparkline = Array.isArray(api.sparkline) && api.sparkline.length > 1 ? api.sparkline : [0, 0, 0, 0, 0, requests];

  return {
    id: String(api.id ?? api._id),
    name: api.name,
    baseUrl: api.baseUrl,
    requests,
    status,
    uptime: Number(api.uptime ?? (status === "Healthy" ? 100 : 0)),
    sparkline,
    lastStatusCode: api.lastStatusCode ?? null,
    lastRequestAt: api.lastRequestAt ?? null,
    upstreamHeaderKeys: Array.isArray(api.upstreamHeaders) ? api.upstreamHeaders : [],
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

function normalizeHttpBaseUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "";
    }

    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const safeData = data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const points = safeData
    .map((v, i) => {
      const x = (i / (safeData.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function APIManagementPage() {
  const [apis, setApis] = useState<ManagedApi[]>([]);
  const [loadingApis, setLoadingApis] = useState(true);
  const [creatingApi, setCreatingApi] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    baseUrl: "",
  });
  const [selectedApi, setSelectedApi] = useState<ManagedApi | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [configureForm, setConfigureForm] = useState({
    name: "",
    baseUrl: "",
  });
  const [configureErrors, setConfigureErrors] = useState({
    name: "",
    baseUrl: "",
  });
  const [gatewayTargetUrl, setGatewayTargetUrl] = useState("");
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [gatewayResult, setGatewayResult] = useState("");
  const [gatewayResultOk, setGatewayResultOk] = useState<boolean | null>(null);
  const [testingGateway, setTestingGateway] = useState(false);
  // Configure form upstream headers: array of {key, value} pairs
  const [upstreamHeaderRows, setUpstreamHeaderRows] = useState<{ key: string; value: string }[]>([]);

  const loadApis = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoadingApis(true);
    }

    try {
      const response = await fetch("/api/apis", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as { items?: BackendApi[] };
      const nextApis = (data.items ?? []).map(normalizeApi);

      setApis(nextApis);
      setSelectedApi((currentApi) =>
        currentApi ? nextApis.find((api) => api.id === currentApi.id) ?? currentApi : currentApi
      );
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Unable to load APIs.");
      }
    } finally {
      if (!silent) {
        setLoadingApis(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadApis();
  }, [loadApis]);

  const resetForm = () => {
    setForm({
      name: "",
      baseUrl: "",
    });
    setErrors({
      name: "",
      baseUrl: "",
    });
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleCreateApi = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const baseUrl = normalizeHttpBaseUrl(form.baseUrl);
    const nextErrors = {
      name: name.length >= 2 ? "" : "Enter an API name with at least 2 characters.",
      baseUrl: baseUrl ? "" : "Enter a valid http or https base URL.",
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.baseUrl) {
      return;
    }

    setCreatingApi(true);

    try {
      const response = await fetch("/api/apis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          baseUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as { api: BackendApi };
      const newApi = normalizeApi(data.api);

      setApis((currentApis) => [newApi, ...currentApis]);
      toast.success("API created successfully.");
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create API.");
    } finally {
      setCreatingApi(false);
    }
  };

  const openDetails = (api: ManagedApi) => {
    setSelectedApi(api);
    setGatewayTargetUrl(api.baseUrl);
    setGatewayResult("");
    setGatewayResultOk(null);
    setDetailsOpen(true);
  };

  const openConfigure = (api: ManagedApi) => {
    setSelectedApi(api);
    setConfigureForm({
      name: api.name,
      baseUrl: api.baseUrl,
    });
    setConfigureErrors({
      name: "",
      baseUrl: "",
    });
    // Seed rows from existing stored header keys (values are secret, shown as empty)
    setUpstreamHeaderRows(
      api.upstreamHeaderKeys.length > 0
        ? api.upstreamHeaderKeys.map((key) => ({ key, value: "" }))
        : [{ key: "", value: "" }]
    );
    setConfigureOpen(true);
  };

  const handleConfigureSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedApi) {
      return;
    }

    const name = configureForm.name.trim();
    const baseUrl = normalizeHttpBaseUrl(configureForm.baseUrl);
    const nextErrors = {
      name: name.length >= 2 ? "" : "Enter an API name with at least 2 characters.",
      baseUrl: baseUrl ? "" : "Enter a valid http or https base URL.",
    };

    setConfigureErrors(nextErrors);

    if (nextErrors.name || nextErrors.baseUrl) {
      return;
    }

    // Build upstreamHeaders object from non-empty rows only
    const upstreamHeaders: Record<string, string> = {};
    for (const row of upstreamHeaderRows) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        upstreamHeaders[k] = v;
      }
    }

    setSavingApi(true);

    try {
      const response = await fetch(`/api/apis/${encodeURIComponent(selectedApi.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          baseUrl,
          ...(Object.keys(upstreamHeaders).length > 0 ? { upstreamHeaders } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as { api: BackendApi };
      const updatedApi = normalizeApi(data.api);

      setApis((currentApis) => currentApis.map((api) => (api.id === updatedApi.id ? updatedApi : api)));
      setSelectedApi(updatedApi);
      setConfigureOpen(false);
      toast.success("API configuration updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update API.");
    } finally {
      setSavingApi(false);
    }
  };

  const handleGatewayTest = async () => {
    const targetUrl = normalizeHttpBaseUrl(gatewayTargetUrl);

    if (!targetUrl) {
      toast.error("Enter a valid target URL.");
      return;
    }

    if (!gatewayApiKey.trim()) {
      toast.error("Enter an API key.");
      return;
    }

    setTestingGateway(true);
    setGatewayResult("");
    setGatewayResultOk(null);

    try {
      const response = await fetch(buildGatewayRequestUrl(targetUrl), {
        method: "GET",
        headers: {
          "x-api-key": gatewayApiKey.trim(),
        },
      });
      const responseText = await response.text();
      const trimmedResponse = responseText.trim();
      const preview = trimmedResponse.length > 200 ? `${trimmedResponse.slice(0, 200)}...` : trimmedResponse;

      setGatewayResultOk(response.ok);
      setGatewayResult(
        `${response.status} ${response.statusText || "Gateway response"}${preview ? `\n${preview}` : ""}`
      );
      await loadApis({ silent: true });

      if (!response.ok) {
        toast.error(`Gateway returned ${response.status} — check the result below.`);
        return;
      }

      toast.success("Gateway request tracked.");
    } catch {
      toast.error("Unable to reach the backend gateway.");
    } finally {
      setTestingGateway(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">APIs</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your API services</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white rounded-xl hover:bg-primary/90 transition-opacity">
              <Plus size={16} className="mr-2" />
              Create API
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateApi} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Create API</DialogTitle>
                <DialogDescription>Add the API service you want StratAPI to track.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-name">Name</Label>
                  <Input
                    id="api-name"
                    value={form.name}
                    onChange={(event) => {
                      setForm((currentForm) => ({ ...currentForm, name: event.target.value }));
                      setErrors((currentErrors) => ({ ...currentErrors, name: "" }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                    placeholder="Test API"
                    className="h-10 rounded-xl"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-base-url">Base URL</Label>
                  <Input
                    id="api-base-url"
                    value={form.baseUrl}
                    onChange={(event) => {
                      setForm((currentForm) => ({ ...currentForm, baseUrl: event.target.value }));
                      setErrors((currentErrors) => ({ ...currentErrors, baseUrl: "" }));
                    }}
                    aria-invalid={Boolean(errors.baseUrl)}
                    placeholder="https://dummyjson.com"
                    className="h-10 rounded-xl font-mono"
                  />
                  {errors.baseUrl && <p className="text-xs text-destructive">{errors.baseUrl}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={creatingApi} className="bg-primary text-white rounded-xl">
                  {creatingApi ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="mr-2" />
                      Create API
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingApis ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading APIs...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apis.map((api) => (
            <div
              key={api.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Globe size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{api.name}</h3>
                    <code className="text-xs text-muted-foreground">{api.baseUrl}</code>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium border-0 uppercase tracking-wider",
                    getStatusClasses(api.status)
                  )}
                >
                  {api.status}
                </Badge>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                  <p className="text-lg font-semibold tracking-tight mt-0.5">
                    {api.requests.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uptime: <span className="text-foreground font-medium">{api.uptime}%</span>
                  </p>
                </div>
                <MiniSparkline
                  data={api.sparkline}
                  color={api.status === "Healthy" ? "#10B981" : api.status === "Unhealthy" ? "#EF4444" : "#F59E0B"}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-xs text-muted-foreground"
                  onClick={() => openDetails(api)}
                >
                  View Details
                  <ExternalLink size={12} className="ml-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-xs text-muted-foreground"
                  onClick={() => openConfigure(api)}
                >
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedApi?.name ?? "API Details"}</DialogTitle>
            <DialogDescription>{selectedApi?.baseUrl}</DialogDescription>
          </DialogHeader>

          {selectedApi && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Requests</p>
                  <p className="mt-1 text-lg font-semibold">{selectedApi.requests.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1 text-lg font-semibold">{selectedApi.status}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway-target-url">Target URL</Label>
                <Input
                  id="gateway-target-url"
                  value={gatewayTargetUrl}
                  onChange={(event) => {
                    setGatewayTargetUrl(event.target.value);
                    setGatewayResult("");
                  }}
                  className="h-10 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway-url">Gateway URL</Label>
                <Input
                  id="gateway-url"
                  value={gatewayTargetUrl ? buildGatewayRequestUrl(gatewayTargetUrl) : ""}
                  readOnly
                  className="h-10 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway-api-key">API Key</Label>
                <Input
                  id="gateway-api-key"
                  value={gatewayApiKey}
                  onChange={(event) => setGatewayApiKey(event.target.value)}
                  className="h-10 rounded-xl font-mono"
                  type="password"
                />
              </div>

              {gatewayResult && (
                <pre
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all",
                    gatewayResultOk === false
                      ? "border-red-500/30 bg-red-500/5 text-red-600"
                      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                  )}
                >
                  {gatewayResult}
                </pre>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleGatewayTest}
                  disabled={testingGateway}
                  className="bg-primary text-white rounded-xl"
                >
                  {testingGateway ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} className="mr-2" />
                      Test Gateway
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
        <DialogContent>
          <form onSubmit={handleConfigureSave} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Configure API</DialogTitle>
              <DialogDescription>Update the API service StratAPI tracks.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configure-api-name">Name</Label>
                <Input
                  id="configure-api-name"
                  value={configureForm.name}
                  onChange={(event) => {
                    setConfigureForm((currentForm) => ({ ...currentForm, name: event.target.value }));
                    setConfigureErrors((currentErrors) => ({ ...currentErrors, name: "" }));
                  }}
                  aria-invalid={Boolean(configureErrors.name)}
                  className="h-10 rounded-xl"
                />
                {configureErrors.name && <p className="text-xs text-destructive">{configureErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="configure-api-base-url">Base URL</Label>
                <Input
                  id="configure-api-base-url"
                  value={configureForm.baseUrl}
                  onChange={(event) => {
                    setConfigureForm((currentForm) => ({ ...currentForm, baseUrl: event.target.value }));
                    setConfigureErrors((currentErrors) => ({ ...currentErrors, baseUrl: "" }));
                  }}
                  aria-invalid={Boolean(configureErrors.baseUrl)}
                  className="h-10 rounded-xl font-mono"
                />
                {configureErrors.baseUrl && <p className="text-xs text-destructive">{configureErrors.baseUrl}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Upstream Headers</Label>
                  <button
                    type="button"
                    onClick={() => setUpstreamHeaderRows((rows) => [...rows, { key: "", value: "" }])}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add header
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Headers forwarded to the real upstream API (e.g.{" "}
                  <code className="font-mono">Authorization</code> or{" "}
                  <code className="font-mono">x-api-key</code>). Values are stored securely and never returned.
                </p>
                {upstreamHeaderRows.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={row.key}
                      onChange={(e) =>
                        setUpstreamHeaderRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r))
                        )
                      }
                      className="h-9 rounded-xl font-mono text-xs flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={row.value}
                      type="password"
                      onChange={(e) =>
                        setUpstreamHeaderRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r))
                        )
                      }
                      className="h-9 rounded-xl font-mono text-xs flex-1"
                    />
                    {upstreamHeaderRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setUpstreamHeaderRows((rows) => rows.filter((_, i) => i !== index))
                        }
                        className="text-xs text-muted-foreground hover:text-destructive px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={savingApi} className="bg-primary text-white rounded-xl">
                {savingApi ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
