import { LayoutDashboard } from "lucide-react";

import { SalesOverviewChart } from "@/components/charts/sales-overview-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getDashboardMetrics } from "@/modules/dashboard/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [snapshot, settings] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
  ]);
  const setupBlock = resolveSetupBlock("dashboard", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  if (setupBlock) {
    return (
      <SetupEmptyState
        block={setupBlock}
        icon={LayoutDashboard}
        steps={[
          { label: "Cadastrar unidade", done: snapshot.hasBranches },
          { label: "Criar categorias de produtos", done: snapshot.hasCategories },
          { label: "Cadastrar produtos no catálogo", done: snapshot.hasProducts },
        ]}
      />
    );
  }

  const dashboard = await getDashboardMetrics();

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Vendas do dia"
          value={formatCurrency(dashboard.summary.today)}
          helper="Movimento consolidado desde 00:00."
        />
        <MetricCard
          label="Vendas da semana"
          value={formatCurrency(dashboard.summary.week)}
          helper="Acompanhamento semanal de faturamento."
        />
        <MetricCard
          label="Vendas do mês"
          value={formatCurrency(dashboard.summary.month)}
          helper="Base principal para análise gerencial."
        />
        <MetricCard
          label="Pendências"
          value={formatCurrency(dashboard.summary.pendingAmount)}
          helper={`${dashboard.summary.receivablesCount} títulos em aberto.`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Vendas por dia
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Data em que a venda foi registrada ({dashboard.monthLabel}) — inclui fiado e pendente no
              dia da venda, não no recebimento.
            </p>
          </div>
          <SalesOverviewChart data={dashboard.salesSeries} />
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Fluxo de caixa
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Valores recebidos por dia ({dashboard.monthLabel}) — quando o pagamento entrou, inclusive
              baixas de contas a receber.
            </p>
          </div>
          <SalesOverviewChart data={dashboard.cashFlowSeries} />
        </Card>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-4",
          SHOW_CUSTOMERS_MODULE_UI ? "md:grid-cols-2" : "md:grid-cols-1",
        )}
      >
        {SHOW_CUSTOMERS_MODULE_UI ? (
          <Card>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Clientes que mais compram
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Top 3 por faturamento.</p>
            <div className="mt-5 space-y-4">
              {dashboard.topCustomers.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma compra registrada ainda.
                </p>
              ) : (
                dashboard.topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4"
                  >
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        #{String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-medium text-[var(--foreground)]">
                        {customer.name}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {customer.purchaseCount} compra(s)
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : null}

        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Contas a receber
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Últimos 3 títulos em aberto.
          </p>
          <div className="mt-5 space-y-3">
            {dashboard.receivables.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nenhum título pendente no momento.
              </p>
            ) : (
              dashboard.receivables.map((receivable) => {
                const overdue = new Date(receivable.dueDate) < new Date();

                return (
                  <div
                    key={receivable.id}
                    className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-white/70 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {receivable.customer.name}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Vencimento em {formatDate(receivable.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--foreground)]">
                        {formatCurrency(Number(receivable.balanceDue))}
                      </p>
                      <div className="mt-2">
                        <Badge tone={overdue ? "danger" : "warning"}>
                          {overdue ? "Vencido" : "Em aberto"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
