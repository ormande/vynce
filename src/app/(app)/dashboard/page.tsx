import { AppShell } from "@/components/layout/app-shell";
import { SalesOverviewChart } from "@/components/charts/sales-overview-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getDashboardMetrics } from "@/modules/dashboard/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getDashboardMetrics();

  return (
    <AppShell
      title="Dashboard"
      subtitle="Panorama do negócio com foco em vendas, inadimplência e capacidade operacional."
      pathname="/dashboard"
    >
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

      <div
        className={cn(
          "mt-4 grid gap-4",
          SHOW_CUSTOMERS_MODULE_UI ? "xl:grid-cols-[1.4fr_0.6fr]" : "xl:grid-cols-1",
        )}
      >
        <Card>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Faturamento da semana
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Tendência recente de vendas para leitura rápida da operação.
            </p>
          </div>
          <SalesOverviewChart data={dashboard.salesSeries} />
        </Card>

        {SHOW_CUSTOMERS_MODULE_UI ? (
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Clientes que mais compram
          </h3>
          <div className="mt-5 space-y-4">
            {dashboard.topCustomers.map((customer, index) => (
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
                    {customer.purchaseCount} compras
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Contas a receber
          </h3>
          <div className="mt-5 space-y-3">
            {dashboard.receivables.map((receivable) => {
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
                        {overdue ? "Vencido" : "Próximo do vencimento"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Estoque baixo
            </h3>
            <Badge tone={dashboard.summary.lowStockCount > 0 ? "warning" : "success"}>
              {dashboard.summary.lowStockCount} itens monitorados
            </Badge>
          </div>
          <div className="mt-5 space-y-3">
            {dashboard.lowStock.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-[var(--border)] bg-white/70 px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {product.category.name}
                    </p>
                  </div>
                  <Badge tone="warning">
                    {product.stockQuantity} un.
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
