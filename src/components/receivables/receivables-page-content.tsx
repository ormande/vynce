"use client";

import { CreditCard } from "lucide-react";

import { PaymentForm } from "@/components/forms/payment-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate, formatReceivableStatus } from "@/lib/utils";

export type ReceivableRow = {
  id: string;
  customer: { name: string };
  balanceDue: string;
  customerId: string;
  saleId: string | null;
  dueDate: Date | string;
  status: string;
  isOverdue: boolean;
  dueSoon: boolean;
};

export function ReceivablesPageContent({
  receivables,
  receivablesForPayment,
}: {
  receivables: ReceivableRow[];
  receivablesForPayment: ReceivableRow[];
}) {
  const openReceivables = receivables.filter((item) => item.status !== "PAID");

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <PaymentForm
        receivables={receivablesForPayment.map((receivable) => ({
          id: receivable.id,
          customer: receivable.customer,
          balanceDue: receivable.balanceDue,
          customerId: receivable.customerId,
          saleId: receivable.saleId,
        }))}
      />

      <Card>
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Pendências e recebimentos
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {openReceivables.length} título(s) em aberto de {receivables.length} no total.
          </p>
        </div>

        {receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--muted-foreground)]">
              <CreditCard className="h-10 w-10 opacity-40" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-[var(--foreground)]">
              Nenhum recebível encontrado
            </h3>
            <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              Vendas fiado aparecem aqui automaticamente para acompanhamento e baixa.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-center">Cliente</th>
                <th className="px-4 py-2 text-center">Vencimento</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((receivable) => (
                <tr
                  key={receivable.id}
                  className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
                >
                  <td className="rounded-l-3xl px-4 py-4 text-center font-medium text-[var(--foreground)]">
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
                          : formatReceivableStatus(receivable.status)}
                    </Badge>
                  </td>
                  <td className="rounded-r-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                    {formatCurrency(receivable.balanceDue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
