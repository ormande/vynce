import { BarChart3 } from "lucide-react";

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

  let snapshot: Awaited<ReturnType<typeof getSetupSnapshot>>;
  let settings: Awaited<ReturnType<typeof getPlatformSettings>>;
  let company: Awaited<ReturnType<typeof getCompanyReports>> | null = null;
  let sellers: Awaited<ReturnType<typeof getSellerPerformanceReport>> | null = null;

  if (currentTab === "empresa") {
    [snapshot, settings, company] = await Promise.all([
      getSetupSnapshot(),
      getPlatformSettings(),
      getCompanyReports(),
    ]);
  } else {
    [snapshot, settings, sellers] = await Promise.all([
      getSetupSnapshot(),
      getPlatformSettings(),
      getSellerPerformanceReport(),
    ]);
  }

  const setupBlock = resolveSetupBlock("reports", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={BarChart3} />
  ) : (
    <ReportsPageContent currentTab={currentTab} company={company} sellers={sellers} />
  );
}
