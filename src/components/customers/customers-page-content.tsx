"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";

import {
  CustomerFormModal,
  type CustomerRow,
} from "@/components/customers/customer-form-modal";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import {
  formatCpfDisplay,
  formatCurrency,
  formatPhoneDisplay,
} from "@/lib/utils";

export function CustomersPageContent({
  customers: initialCustomers,
  canWrite,
}: {
  customers: CustomerRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [formOpen, setFormOpen] = useState(false);

  async function refreshCustomers() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setCustomers(data);
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {customers.length} cliente(s) cadastrado(s).
        </p>
        {canWrite ? (
          <ActionButton icon={Plus} onClick={() => setFormOpen(true)}>
            Novo cliente
          </ActionButton>
        ) : null}
      </div>

      {customers.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--muted-foreground)]">
            <Users className="h-10 w-10 opacity-40" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
            Nenhum cliente cadastrado
          </h3>
          <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Cadastre clientes para vendas fiado, histórico de compras e saldo devedor automático.
          </p>
          {canWrite ? (
            <ActionButton
              onClick={() => setFormOpen(true)}
              icon={Plus}
              className="mt-6"
            >
              Cadastrar primeiro cliente
            </ActionButton>
          ) : null}
        </Card>
      ) : (
        <Card className="mt-6">
          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-center">Cliente</th>
                <th className="px-4 py-2 text-center">Telefone</th>
                <th className="px-4 py-2 text-center">CPF</th>
                <th className="px-4 py-2 text-center">Compras</th>
                <th className="px-4 py-2 text-center">Saldo devedor</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
                >
                  <td className="rounded-l-3xl px-4 py-4 text-center font-medium text-[var(--foreground)]">
                    {customer.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatPhoneDisplay(customer.phone)}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatCpfDisplay(customer.cpf)}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {customer.purchaseHistoryCount}
                  </td>
                  <td className="rounded-r-3xl px-4 py-4">
                    {customer.outstandingBalance > 0 ? (
                      <Badge tone="warning">
                        {formatCurrency(customer.outstandingBalance)}
                      </Badge>
                    ) : (
                      <span className="font-medium text-[var(--foreground)]">
                        {formatCurrency(0)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <CustomerFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void refreshCustomers()}
      />
    </>
  );
}
