export const kpiData = [
  {
    title: "Total Requests",
    value: 0,
    change: 0,
    trend: "up" as const,
    icon: "Activity",
    gradient: "bg-primary/10 text-primary",
  },
  {
    title: "Active API Keys",
    value: 0,
    change: 0,
    trend: "up" as const,
    icon: "Key",
    gradient: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Error Rate",
    value: 0,
    change: 0,
    trend: "down" as const,
    icon: "AlertTriangle",
    gradient: "bg-amber-500/10 text-amber-600",
    suffix: "%",
  },
  {
    title: "Revenue",
    value: 0,
    change: 0,
    trend: "up" as const,
    icon: "DollarSign",
    gradient: "bg-green-500/10 text-green-600",
    prefix: "$",
  },
];

export const requestsChartData = [
  { date: "Today", requests: 0, errors: 0 },
];

export const statusPieData = [
  { name: "Success", value: 0, fill: "#10B981" },
  { name: "Errors", value: 0, fill: "#EF4444" },
];

export const recentActivity: Array<{
  id: number;
  apiName: string;
  endpoint: string;
  status: "success" | "error";
  latency: number;
  timestamp: string;
}> = [];

export const apiKeys: Array<{
  id: number;
  key: string;
  name: string;
  usage: number;
  status: string;
  created: string;
}> = [];

export const apiList: Array<{
  id: number;
  name: string;
  baseUrl: string;
  requests: number;
  status: string;
  uptime: number;
  sparkline: number[];
}> = [];

export const analyticsData = {
  requestsPerMinute: [{ time: "00:00", requests: 0 }],
  latency: [{ time: "00:00", p50: 0, p95: 0, p99: 0 }],
  errorRate: [
    { date: "Mon", rate: 0 },
    { date: "Tue", rate: 0 },
    { date: "Wed", rate: 0 },
    { date: "Thu", rate: 0 },
    { date: "Fri", rate: 0 },
    { date: "Sat", rate: 0 },
    { date: "Sun", rate: 0 },
  ],
};

export const billingData = {
  currentPlan: {
    name: "Starter",
    price: 0,
    requests: "0",
    features: ["No API usage recorded yet"],
  },
  plans: [
    { name: "Starter", price: 0, requests: "0", current: true },
  ],
  usage: {
    requests: 0,
    limit: 1,
    cost: 0,
  },
  invoices: [] as Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>,
};
