import { SaleForm } from "@/components/forms/sale-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { getCustomersForSaleForm } from "@/modules/customers/service";
import { getProducts } from "@/modules/products/service";
import { getSales } from "@/modules/sales/service";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, customers, products] = await Promise.all([
    getSales(),
    getCustomersForSaleForm(),
    getProducts({ status: "ALL" }),
  ]);

  return (
    <AppShell
      title="Vendas"
      subtitle="Registro operacional de vendas com suporte a pagamento à vista e fiado."
      pathname="/sales"
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SaleForm
          showCustomerSelector={SHOW_CUSTOMERS_MODULE_UI}
          customers={customers}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            salePrice: product.salePrice.toString(),
            stockQuantity: product.stockQuantity,
          }))}
        />

        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Histórico recente
          </h3>
          <Table className="mt-4">
            <thead>
              <tr className="text-left text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Forma</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="rounded-3xl bg-[var(--panel-strong)]">
                  <td className="rounded-l-3xl px-4 py-4">
                    <p className="font-medium text-[var(--foreground)]">
                      {sale.customer.name}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {sale.items.length} item(ns)
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {sale.paymentMethod}
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      tone={
                        sale.paymentStatus === "PAID"
                          ? "success"
                          : sale.paymentStatus === "PARTIAL"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatDate(sale.soldAt)}
                  </td>
                  <td className="rounded-r-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                    {formatCurrency(sale.total.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
