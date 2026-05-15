import { AppShell } from "@/components/layout/app-shell";
import { ReportsPageContent } from "@/components/reports/reports-page-content";
import { getCompanyReports, getSellerPerformanceReport } from "@/modules/reports/service";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab === "funcionarios" ? "funcionarios" : "empresa";

  const [company, sellers] = await Promise.all([
    getCompanyReports(),
    getSellerPerformanceReport(),
  ]);

  return (
    <AppShell
      title="Relatórios"
      subtitle="Indicadores da empresa e desempenho da equipe de vendas."
      pathname="/reports"
    >
      <ReportsPageContent currentTab={currentTab} company={company} sellers={sellers} />
    </AppShell>
  );
}
