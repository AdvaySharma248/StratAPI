"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { Zap } from "lucide-react";
import { useAppStore, type PageId } from "@/lib/store";
import { useAuth, AuthProvider, type UserRole, roleDefaultPage } from "@/lib/auth";
import { LoginPage } from "@/components/auth/login-page";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandPalette } from "@/components/common/command-palette";

// --- Owner pages (existing) ---
import { DashboardPage } from "@/components/dashboard/dashboard-page";
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

// --- All pages registry ---
const ownerPages: Record<string, ComponentType> = {
  dashboard: DashboardPage,
  apis: APIManagementPage,
  "api-keys": APIKeysPage,
  analytics: AnalyticsPage,
  billing: BillingPage,
  settings: SettingsPage,
};

const consumerPages: Record<string, ComponentType> = {
  overview: ConsumerOverviewPage,
  "my-api-keys": ConsumerApiKeysPage,
  "usage-history": ConsumerUsageHistoryPage,
};

const adminPages: Record<string, ComponentType> = {
  "all-users": AdminAllUsersPage,
  "all-apis": AdminAllApisPage,
  "system-stats": AdminSystemStatsPage,
};

const pagesByRole: Record<UserRole, Record<string, ComponentType>> = {
  owner: ownerPages,
  consumer: consumerPages,
  admin: adminPages,
};

function AuthenticatedApp({ initialPage }: { initialPage?: PageId }) {
  const { user } = useAuth();
  const { currentPage, setCurrentPage } = useAppStore();
  const appliedInitialPage = useRef<PageId | null>(null);
  const role = user?.role ?? "owner";
  const allowedPages = pagesByRole[role];

  useEffect(() => {
    if (!user || !initialPage || appliedInitialPage.current === initialPage || !allowedPages[initialPage]) {
      return;
    }

    appliedInitialPage.current = initialPage;
    setCurrentPage(initialPage);
  }, [allowedPages, initialPage, setCurrentPage, user]);

  if (!user) return null;

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

export function StratAPIApp({ initialPage }: { initialPage?: PageId } = {}) {
  return (
    <AuthProvider>
      <AppContent initialPage={initialPage} />
    </AuthProvider>
  );
}

function AppContent({ initialPage }: { initialPage?: PageId }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-10 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Zap size={24} className="text-white" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">StratAPI</h1>
            <p className="text-sm text-muted-foreground">Loading your secure workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp initialPage={initialPage} />;
}
