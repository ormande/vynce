import { Receipt } from "lucide-react";
import { SaleForm } from "@/components/forms/sale-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
  formatSalePaymentStatus,
} from "@/lib/utils";
import { listActiveBranches } from "@/modules/branches/service";
import { getCustomersForSaleForm } from "@/modules/customers/service";
import { getProducts } from "@/modules/products/service";
import { getSales } from "@/modules/sales/service";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const session = await auth();
  const isSeller = session?.user?.roleSlug === "seller";
  const branchIds = session?.user?.branchIds ?? [];

  const [allBranches, customers, products] = await Promise.all([
    listActiveBranches(),
    getCustomersForSaleForm(),
    getProducts({ status: "ALL" }),
  ]);

  const branches = isSeller
    ? allBranches.filter((b) => branchIds.includes(b.id))
    : allBranches;

  const sales = await getSales(
    undefined,
    isSeller && branchIds.length > 0 ? branchIds : undefined,
  );

  const defaultBranchId =
    branches.find((b) => !b.isWarehouse)?.id ?? branches[0]?.id ?? "";

  const defaultCustomerId = customers[0]?.id ?? "";

  return (
    <AppShell
      title="Vendas"
      subtitle="Registro de vendas à vista com atualização automática de estoque."
      pathname="/sales"
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SaleForm
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            isWarehouse: b.isWarehouse,
          }))}
          defaultBranchId={defaultBranchId}
          customerId={defaultCustomerId}
          products={products.items.map((product) => ({
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
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-left">Unidade</th>
                <th className="px-4 py-2">Forma</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-3">
                        <Receipt className="h-6 w-6 opacity-40" />
                      </div>
                      <p>Nenhuma venda registrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="rounded-3xl bg-[var(--panel-strong)] text-center"
                  >
                    <td className="rounded-l-3xl px-4 py-4 text-left">
                      <p className="font-medium text-[var(--foreground)]">{sale.branch.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {sale.items.length} item(ns)
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {formatPaymentMethod(sale.paymentMethod)}
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
                        {formatSalePaymentStatus(sale.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {formatDateTime(sale.soldAt)}
                    </td>
                    <td className="rounded-r-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                      {formatCurrency(sale.total.toString())}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
