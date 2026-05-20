"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

import {
  CustomerFormModal,
  type CustomerRow,
} from "@/components/customers/customer-form-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { cn, formatCpfDisplay, formatCurrency, formatPhoneDisplay } from "@/lib/utils";
import { toast } from "sonner";

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
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshCustomers() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setCustomers(data);
    }
    router.refresh();
  }

  function handleOpenCreate() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function handleOpenEdit(customer: CustomerRow) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível excluir o cliente", { description: data.message });
        return;
      }
      toast.success(
        data?.mode === "soft"
          ? "Cliente removido da listagem. Histórico de vendas preservado."
          : "Cliente excluído com sucesso.",
      );
      setDeletingCustomer(null);
      await refreshCustomers();
    } catch {
      toast.error("Erro ao excluir cliente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {customers.length} cliente(s) cadastrado(s).
        </p>
        {canWrite ? (
          <ActionButton icon={Plus} onClick={handleOpenCreate}>
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
              onClick={handleOpenCreate}
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
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-center">Telefone</th>
                <th className="px-4 py-2 text-center">CPF</th>
                <th className="px-4 py-2 text-center">Compras</th>
                <th className="px-4 py-2 text-center">Saldo devedor</th>
                {canWrite ? (
                  <th className="px-4 py-2 text-right">Ações</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
                >
                  <td className="rounded-l-3xl px-4 py-4 text-left font-medium text-[var(--foreground)]">
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
                  <td className={cn("px-4 py-4", !canWrite && "rounded-r-3xl")}>
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
                  {canWrite ? (
                    <td className="rounded-r-3xl px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                          title="Editar cliente"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCustomer(customer)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-rose-50 hover:text-rose-600"
                          title="Excluir cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <CustomerFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCustomer(null);
        }}
        onSaved={() => void refreshCustomers()}
        customer={editingCustomer}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Excluir cliente"
        description={
          deletingCustomer && deletingCustomer.purchaseHistoryCount > 0
            ? `"${deletingCustomer.name}" tem ${deletingCustomer.purchaseHistoryCount} compra(s) registrada(s). O cliente será removido da listagem, mas o histórico de vendas e recebíveis será preservado.`
            : `Tem certeza que deseja excluir "${deletingCustomer?.name}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel={
          deletingCustomer && deletingCustomer.purchaseHistoryCount > 0
            ? "Remover da listagem"
            : "Excluir"
        }
      />
    </>
  );
}
