"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KPICards, type KpiItem } from "@/components/dashboard/kpi-cards";
import { RequestsChart, type RequestsChartPoint } from "@/components/dashboard/requests-chart";
import { StatusPieChart, type StatusPiePoint } from "@/components/dashboard/status-pie-chart";
import { ActivityTable, type ActivityItem } from "@/components/dashboard/activity-table";

interface BackendApi {
  _id?: string;
  id?: string;
  name: string;
  requests?: number;
  usageLogCount?: number;
}

interface BackendApiKey {
  status: string;
}

interface UsageLog {
  _id?: string;
  id?: string;
  apiId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latency: number;
  timestamp: string;
}

interface BillingSummary {
  currentInvoice?: {
    amount?: number;
  } | null;
}

interface DashboardData {
  kpis: KpiItem[];
  requestsChart: RequestsChartPoint[];
  statusPie: StatusPiePoint[];
  recentActivity: ActivityItem[];
}

function emptyDashboardData(): DashboardData {
  return {
    kpis: [
      { title: "Total Requests", value: 0, change: 0, trend: "up", icon: "Activity" },
      { title: "Active API Keys", value: 0, change: 0, trend: "up", icon: "Key" },
      { title: "Error Rate", value: 0, change: 0, trend: "down", icon: "AlertTriangle", suffix: "%" },
      { title: "Revenue", value: 0, change: 0, trend: "up", icon: "DollarSign", prefix: "Rs. " },
    ],
    requestsChart: [{ date: "Today", requests: 0, errors: 0 }],
    statusPie: [
      { name: "Success", value: 0, fill: "#10B981" },
      { name: "Errors", value: 0, fill: "#EF4444" },
    ],
    recentActivity: [],
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json() as Promise<T>;
}

function getApiId(api: BackendApi) {
  return String(api.id ?? api._id ?? "");
}

function getDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function getChartLabel(date: Date, todayKey: string) {
  if (getDateKey(date) === todayKey) {
    return "Today";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function buildRequestsChartData(logs: UsageLog[]): RequestsChartPoint[] {
  const today = new Date();
  const todayKey = getDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    return date;
  });
  const buckets = new Map(
    days.map((date) => [
      getDateKey(date),
      {
        date: getChartLabel(date, todayKey),
        requests: 0,
        errors: 0,
      },
    ])
  );

  logs.forEach((log) => {
    const timestamp = new Date(log.timestamp);
    const bucket = buckets.get(getDateKey(timestamp));

    if (!bucket) {
      return;
    }

    bucket.requests += 1;

    if (log.statusCode >= 400) {
      bucket.errors += 1;
    }
  });

  return Array.from(buckets.values());
}

function buildDashboardData(
  apis: BackendApi[],
  apiKeys: BackendApiKey[],
  usageLogs: UsageLog[],
  billingSummary: BillingSummary
): DashboardData {
  const apiNameById = new Map(apis.map((api) => [getApiId(api), api.name]));
  const totalRequests = apis.reduce((sum, api) => sum + Number(api.requests ?? api.usageLogCount ?? 0), 0);
  const activeApiKeys = apiKeys.filter((key) => key.status === "active").length;
  const recentErrors = usageLogs.filter((log) => log.statusCode >= 400).length;
  const errorRate = usageLogs.length ? Number(((recentErrors / usageLogs.length) * 100).toFixed(2)) : 0;
  const revenue = Number(billingSummary.currentInvoice?.amount ?? 0);
  const successRate = usageLogs.length ? Number((((usageLogs.length - recentErrors) / usageLogs.length) * 100).toFixed(1)) : 0;
  const errorShare = usageLogs.length ? Number(((recentErrors / usageLogs.length) * 100).toFixed(1)) : 0;

  return {
    kpis: [
      { title: "Total Requests", value: totalRequests, change: 0, trend: "up", icon: "Activity" },
      { title: "Active API Keys", value: activeApiKeys, change: 0, trend: "up", icon: "Key" },
      { title: "Error Rate", value: errorRate, change: 0, trend: "down", icon: "AlertTriangle", suffix: "%" },
      { title: "Revenue", value: revenue, change: 0, trend: "up", icon: "DollarSign", prefix: "Rs. " },
    ],
    requestsChart: buildRequestsChartData(usageLogs),
    statusPie: [
      { name: "Success", value: successRate, fill: "#10B981" },
      { name: "Errors", value: errorShare, fill: "#EF4444" },
    ],
    recentActivity: usageLogs.slice(0, 8).map((log, index) => ({
      id: log.id ?? log._id ?? `${log.apiId}-${log.timestamp}-${index}`,
      apiName: apiNameById.get(String(log.apiId)) ?? "Unknown API",
      endpoint: `${log.method} ${log.endpoint}`,
      status: log.statusCode >= 400 ? "error" : "success",
      latency: Number(log.latency ?? 0),
      timestamp: log.timestamp,
    })),
  };
}

async function loadDashboardData() {
  const [{ items: apis = [] }, { items: usageLogs = [] }, billingSummary] = await Promise.all([
    fetchJson<{ items?: BackendApi[] }>("/api/apis"),
    fetchJson<{ items?: UsageLog[] }>("/api/usage-logs?limit=100"),
    fetchJson<BillingSummary>("/api/billing/summary"),
  ]);
  const keyGroups = await Promise.all(
    apis
      .map(getApiId)
      .filter(Boolean)
      .map((apiId) => fetchJson<{ items?: BackendApiKey[] }>(`/api/apis/${encodeURIComponent(apiId)}/keys`))
  );
  const apiKeys = keyGroups.flatMap((group) => group.items ?? []);

  return buildDashboardData(apis, apiKeys, usageLogs, billingSummary);
}

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(() => emptyDashboardData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function refreshDashboard() {
      try {
        const nextDashboardData = await loadDashboardData();

        if (!ignore) {
          setDashboardData(nextDashboardData);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : "Unable to load dashboard.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void refreshDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Syncing live metrics..." : "Overview of your API usage and performance"}
        </p>
      </div>
      <KPICards data={dashboardData.kpis} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RequestsChart data={dashboardData.requestsChart} />
        </div>
        <div>
          <StatusPieChart data={dashboardData.statusPie} />
        </div>
      </div>
      <ActivityTable data={dashboardData.recentActivity} />
    </div>
  );
}
