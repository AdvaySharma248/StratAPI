"use client";

import { useAppStore } from "@/lib/store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandPalette } from "@/components/common/command-palette";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { APIKeysPage } from "@/components/api-keys/api-keys-page";
import { APIManagementPage } from "@/components/api-management/api-management-page";
import { AnalyticsPage } from "@/components/analytics/analytics-page";
import { BillingPage } from "@/components/billing/billing-page";
import { SettingsPage } from "@/components/settings/settings-page";

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your API usage and performance</p>
      </div>
      <KPICards />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RequestsChart />
        </div>
        <div>
          <StatusPieChart />
        </div>
      </div>
      <ActivityTable />
    </div>
  );
}

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  apis: APIManagementPage,
  "api-keys": APIKeysPage,
  analytics: AnalyticsPage,
  billing: BillingPage,
  settings: SettingsPage,
};

export default function Home() {
  const { currentPage } = useAppStore();
  const PageComponent = pages[currentPage] || DashboardPage;

  return (
    <DashboardLayout>
      <PageComponent />
      <CommandPalette />
    </DashboardLayout>
  );
}
