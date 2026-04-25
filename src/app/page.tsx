"use client";

import { useAppStore, type PageId } from "@/lib/store";
import { useAuth, AuthProvider, type UserRole, roleDefaultPage } from "@/lib/auth";
import { LoginPage } from "@/components/auth/login-page";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandPalette } from "@/components/common/command-palette";

// --- Owner pages (existing) ---
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { APIKeysPage } from "@/components/api-keys/api-keys-page";
import { APIManagementPage } from "@/components/api-management/api-management-page";
import { AnalyticsPage } from "@/components/analytics/analytics-page";
import { BillingPage } from "@/components/billing/billing-page";
import { SettingsPage } from "@/components/settings/settings-page";

// --- Consumer pages (new) ---
import { ConsumerOverviewPage } from "@/components/consumer/consumer-overview";
import { ConsumerApiKeysPage } from "@/components/consumer/consumer-api-keys";
import { ConsumerUsageHistoryPage } from "@/components/consumer/consumer-usage-history";

// --- Admin pages (new) ---
import { AdminAllUsersPage } from "@/components/admin/admin-all-users";
import { AdminAllApisPage } from "@/components/admin/admin-all-apis";
import { AdminSystemStatsPage } from "@/components/admin/admin-system-stats";

// --- Owner sub-pages ---
function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your API usage and performance</p>
      </div>
      <KPICards />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RequestsChart /></div>
        <div><StatusPieChart /></div>
      </div>
      <ActivityTable />
    </div>
  );
}

// --- All pages registry ---
const ownerPages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  apis: APIManagementPage,
  "api-keys": APIKeysPage,
  analytics: AnalyticsPage,
  billing: BillingPage,
  settings: SettingsPage,
};

const consumerPages: Record<string, React.ComponentType> = {
  overview: ConsumerOverviewPage,
  "my-api-keys": ConsumerApiKeysPage,
  "usage-history": ConsumerUsageHistoryPage,
};

const adminPages: Record<string, React.ComponentType> = {
  "all-users": AdminAllUsersPage,
  "all-apis": AdminAllApisPage,
  "system-stats": AdminSystemStatsPage,
};

const pagesByRole: Record<UserRole, Record<string, React.ComponentType>> = {
  owner: ownerPages,
  consumer: consumerPages,
  admin: adminPages,
};

function AuthenticatedApp() {
  const { user } = useAuth();
  const { currentPage, setCurrentPage } = useAppStore();

  if (!user) return null;

  const role = user.role;
  const allowedPages = pagesByRole[role];
  const PageComponent = allowedPages[currentPage] ?? Object.values(allowedPages)[0];

  // On role change, redirect to default page if current is not allowed
  if (!allowedPages[currentPage]) {
    setCurrentPage(roleDefaultPage[role] as typeof currentPage);
    return null;
  }

  return (
    <DashboardLayout>
      <PageComponent />
      <CommandPalette />
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}
