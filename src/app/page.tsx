"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandPalette } from "@/components/common/command-palette";
import { useAppStore } from "@/lib/store";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { APIKeysPage } from "@/components/api-keys/api-keys-page";
import { APIManagementPage } from "@/components/api-management/api-management-page";
import { AnalyticsPage } from "@/components/analytics/analytics-page";
import { BillingPage } from "@/components/billing/billing-page";
import { SettingsPage } from "@/components/settings/settings-page";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <PageComponent />
        </motion.div>
      </AnimatePresence>
      <CommandPalette />
    </DashboardLayout>
  );
}
