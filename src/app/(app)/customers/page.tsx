import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { CustomerForm } from "@/components/forms/customer-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { formatCurrency } from "@/lib/utils";
import { getCustomers } from "@/modules/customers/service";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  if (!SHOW_CUSTOMERS_MODULE_UI) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const customers = await getCustomers(params?.q);

  return (
    <AppShell
      title="Clientes"
      subtitle="Cadastro com visão de histórico de compras e saldo devedor calculado automaticamente."
      pathname="/customers"
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <CustomerForm />
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Base de clientes
            </h3>
          </div>
          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2">Contato</th>
                <th className="px-4 py-2">Compras</th>
                <th className="px-4 py-2">Saldo devedor</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-3">
                        <Users className="h-6 w-6 opacity-40" />
                      </div>
                      <p>Nenhum cliente cadastrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md text-center">
                    <td className="rounded-l-3xl px-4 py-4 font-medium text-[var(--foreground)] text-left">
                      {customer.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {customer.purchaseHistoryCount}
                    </td>
                    <td className="rounded-r-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                      {formatCurrency(customer.outstandingBalance)}
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
