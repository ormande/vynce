"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SaleForm } from "@/components/forms/sale-form";
import {
  SaleEditModal,
  type SaleRecordRow,
} from "@/components/sales/sale-edit-modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Table } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn, formatCurrency, formatDateTime, formatPaymentMethod, formatSalePaymentStatus } from "@/lib/utils";

type BranchOption = {
  id: string;
  name: string;
  isWarehouse: boolean;
};

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  isWalkIn?: boolean;
};

type ProductOption = {
  id: string;
  name: string;
  salePrice: string;
};

export function SalesPageContent({
  tab,
  page,
  totalPages,
  sales,
  branches,
  defaultBranchId,
  walkInCustomerId,
  customers,
  showCustomerPicker,
  products,
  canWrite,
}: {
  tab: "register" | "records";
  page: number;
  totalPages: number;
  sales: SaleRecordRow[];
  branches: BranchOption[];
  defaultBranchId: string;
  walkInCustomerId: string;
  customers: CustomerOption[];
  showCustomerPicker: boolean;
  products: ProductOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [editingSale, setEditingSale] = useState<SaleRecordRow | null>(null);
  const [deletingSale, setDeletingSale] = useState<SaleRecordRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingSale) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sales/${deletingSale.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível excluir a venda", { description: data.message });
        return;
      }
      toast.success("Venda excluída com sucesso.");
      setDeletingSale(null);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir a venda.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          <Link
            href="/sales?tab=register"
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap",
              tab === "register"
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
            )}
          >
            Registrar venda
          </Link>
          <Link
            href="/sales?tab=records"
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
        <div className="w-full">
          <SaleForm
            branches={branches}
            defaultBranchId={defaultBranchId}
            walkInCustomerId={walkInCustomerId}
            customers={customers}
            showCustomerPicker={showCustomerPicker}
            products={products}
          />
        </div>
      ) : (
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Registros de vendas
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Edite ou exclua vendas registradas. Exclusão com fiado pago parcial é bloqueada.
            </p>
          </div>

          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-center">Cliente</th>
                <th className="px-4 py-2 text-center">Unidade</th>
                <th className="px-4 py-2 text-center">Forma</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Data</th>
                <th className="px-4 py-2 text-center">Total</th>
                {canWrite ? (
                  <th className="px-4 py-2 text-right">Ações</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 7 : 6}
                    className="py-12 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)]">
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
                    className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
                  >
                    <td className="rounded-l-3xl px-4 py-4 text-center font-medium text-[var(--foreground)]">
                      {sale.customer.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {sale.branch.name}
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
                    <td
                      className={cn(
                        "px-4 py-4 font-medium text-[var(--foreground)]",
                        !canWrite && "rounded-r-3xl",
                      )}
                    >
                      {formatCurrency(sale.total)}
                    </td>
                    {canWrite ? (
                      <td className="rounded-r-3xl px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Editar venda"
                            onClick={() => setEditingSale(sale)}
                            className="rounded-full border border-[var(--border-strong)] bg-white/90 p-2 text-[var(--foreground)] shadow-sm transition hover:bg-[var(--panel-strong)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Excluir venda"
                            onClick={() => setDeletingSale(sale)}
                            className="rounded-full border border-rose-200 bg-white/90 p-2 text-rose-600 shadow-sm transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          <TablePagination
            page={page}
            totalPages={totalPages}
            hrefBase="/sales?tab=records"
          />
        </Card>
      )}

      <SaleEditModal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        sale={editingSale}
        customers={customers}
        showCustomerPicker={showCustomerPicker}
        onSaved={() => router.refresh()}
      />

      <ConfirmationModal
        isOpen={!!deletingSale}
        onClose={() => {
          if (!isDeleting) setDeletingSale(null);
        }}
        onConfirm={handleDelete}
        title="Excluir venda?"
        description="O estoque será estornado na unidade (se aplicável). Vendas fiado com pagamentos não podem ser excluídas."
        confirmLabel={isDeleting ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
