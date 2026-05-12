import { PaymentForm } from "@/components/forms/payment-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReceivables } from "@/modules/payments/service";

export const dynamic = "force-dynamic";

export default async function ReceivablesPage() {
  const receivables = await getReceivables();

  return (
    <AppShell
      title="Contas a receber"
      subtitle="Acompanhamento de vencimentos, pendências e registro de pagamentos recebidos."
      pathname="/receivables"
    >
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <PaymentForm
          receivables={receivables.map((receivable) => ({
            id: receivable.id,
            customer: receivable.customer,
            balanceDue: receivable.balanceDue.toString(),
            customerId: receivable.customerId,
            saleId: receivable.saleId,
          }))}
        />
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Pendências e recebimentos
          </h3>
          <Table className="mt-4">
            <thead>
              <tr className="text-left text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((receivable) => (
                <tr key={receivable.id} className="rounded-3xl bg-[var(--panel-strong)]">
                  <td className="rounded-l-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                    {receivable.customer.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatDate(receivable.dueDate)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      tone={
                        receivable.isOverdue
                          ? "danger"
                          : receivable.dueSoon
                            ? "warning"
                            : receivable.status === "PAID"
                              ? "success"
                              : "neutral"
                      }
                    >
                      {receivable.isOverdue
                        ? "Vencido"
                        : receivable.dueSoon
                          ? "Próximo"
                          : receivable.status}
                    </Badge>
                  </td>
                  <td className="rounded-r-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                    {formatCurrency(receivable.balanceDue.toString())}
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
