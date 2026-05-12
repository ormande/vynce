import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { formatCurrency, cn } from "@/lib/utils";
import { getReportsOverview } from "@/modules/dashboard/service";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getReportsOverview();

  return (
    <AppShell
      title="Relatórios"
      subtitle="Visão gerencial com indicadores consolidados para períodos curtos e leitura estratégica."
      pathname="/reports"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--muted-foreground)]">Vendas do dia</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {formatCurrency(reports.summary.today)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted-foreground)]">Vendas da semana</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {formatCurrency(reports.summary.week)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted-foreground)]">Vendas do mês</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {formatCurrency(reports.summary.month)}
          </p>
        </Card>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-4",
          SHOW_CUSTOMERS_MODULE_UI ? "xl:grid-cols-2" : "xl:grid-cols-1",
        )}
      >
        {SHOW_CUSTOMERS_MODULE_UI ? (
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Clientes que mais compram
          </h3>
          <div className="mt-4 space-y-3">
            {reports.topCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--foreground)]">{customer.name}</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        ) : null}
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Estoque baixo
          </h3>
          <div className="mt-4 space-y-3">
            {reports.lowStock.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {product.stockQuantity} un.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
