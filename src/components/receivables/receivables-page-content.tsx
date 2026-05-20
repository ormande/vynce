"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PaymentForm } from "@/components/forms/payment-form";
import { ReceivableEditModal } from "@/components/receivables/receivable-edit-modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Table } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  cn,
  formatCurrency,
  formatDate,
  formatReceivableStatus,
} from "@/lib/utils";

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
  notes?: string | null;
};

export function ReceivablesPageContent({
  tab,
  page,
  totalPages,
  receivables,
  receivablesForPayment,
  canWrite,
}: {
  tab: "register" | "records";
  page: number;
  totalPages: number;
  receivables: ReceivableRow[];
  receivablesForPayment: ReceivableRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ReceivableRow | null>(null);
  const [deleting, setDeleting] = useState<ReceivableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receivables/${deleting.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível excluir o título", { description: data.message });
        return;
      }
      toast.success("Título excluído com sucesso.");
      setDeleting(null);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir o título.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          <Link
            href="/receivables?tab=register"
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap",
              tab === "register"
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
            )}
          >
            Registrar pagamento
          </Link>
          <Link
            href="/receivables?tab=records"
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap",
              tab === "records"
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
            )}
          >
            Registros
          </Link>
        </div>
      </div>

      {tab === "register" ? (
        <div className="max-w-lg">
          <PaymentForm
            receivables={receivablesForPayment.map((receivable) => ({
              id: receivable.id,
              customer: receivable.customer,
              balanceDue: receivable.balanceDue,
              customerId: receivable.customerId,
              saleId: receivable.saleId,
            }))}
          />
        </div>
      ) : (
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Registros de títulos
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Acompanhe, edite vencimentos ou exclua títulos sem pagamentos registrados.
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
            </div>
          ) : (
            <>
              <Table>
                <thead>
                  <tr className="text-center text-sm text-[var(--muted-foreground)]">
                    <th className="px-4 py-2 text-center">Cliente</th>
                    <th className="px-4 py-2 text-center">Vencimento</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-center">Saldo</th>
                    {canWrite ? (
                      <th className="px-4 py-2 text-right">Ações</th>
                    ) : null}
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
                      <td
                        className={cn(
                          "px-4 py-4 font-medium text-[var(--foreground)]",
                          !canWrite && "rounded-r-3xl",
                        )}
                      >
                        {formatCurrency(receivable.balanceDue)}
                      </td>
                      {canWrite ? (
                        <td className="rounded-r-3xl px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Editar título"
                              disabled={receivable.status === "PAID"}
                              onClick={() => setEditing(receivable)}
                              className="rounded-full border border-[var(--border-strong)] bg-white/90 p-2 text-[var(--foreground)] shadow-sm transition hover:bg-[var(--panel-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Excluir título"
                              disabled={receivable.status === "PAID"}
                              onClick={() => setDeleting(receivable)}
                              className="rounded-full border border-rose-200 bg-white/90 p-2 text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
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

              <TablePagination
                page={page}
                totalPages={totalPages}
                hrefBase="/receivables?tab=records"
              />
            </>
          )}
        </Card>
      )}

      <ReceivableEditModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        receivable={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmationModal
        isOpen={!!deleting}
        onClose={() => {
          if (!isDeleting) setDeleting(null);
        }}
        onConfirm={handleDelete}
        title="Excluir título?"
        description={
          deleting?.saleId
            ? "Este título está vinculado a uma venda fiado. A venda será excluída e o estoque estornado."
            : "O título será removido permanentemente."
        }
        confirmLabel={isDeleting ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
