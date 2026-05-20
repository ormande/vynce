import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ReportsPageContent } from "@/components/reports/reports-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { getCompanyReports, getSellerPerformanceReport } from "@/modules/reports/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab === "funcionarios" ? "funcionarios" : "empresa";

  const [snapshot, settings, company, sellers] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getCompanyReports(),
    getSellerPerformanceReport(),
  ]);

  const setupBlock = resolveSetupBlock("reports", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return (
    <AppShell
      title="Relatórios"
      subtitle="Indicadores da empresa e desempenho da equipe de vendas."
      pathname="/reports"
    >
      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={BarChart3} />
      ) : (
        <ReportsPageContent currentTab={currentTab} company={company} sellers={sellers} />
      )}
    </AppShell>
  );
}
