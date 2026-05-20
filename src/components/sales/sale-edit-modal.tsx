"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomerSearchInput } from "@/components/sales/customer-search-input";
import { Textarea } from "@/components/ui/textarea";
import { useAnimatedModal } from "@/lib/use-animated-modal";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

export type SaleRecordRow = {
  id: string;
  branch: { name: string };
  customer: { id: string; name: string };
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  soldAt: string;
  dueDate: string | null;
  notes: string | null;
  total: string;
  items: { quantity: number; product: { name: string }; total: string }[];
};

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  isWalkIn?: boolean;
};

export function SaleEditModal({
  isOpen,
  onClose,
  sale,
  customers,
  showCustomerPicker,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecordRow | null;
  customers: CustomerOption[];
  showCustomerPicker: boolean;
  onSaved: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);
  const [customerId, setCustomerId] = useState("");
  const [useCustomSoldAt, setUseCustomSoldAt] = useState(false);
  const [soldAt, setSoldAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isCredit = sale?.paymentMethod === PaymentMethod.CREDIT;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sale) return;
    setCustomerId(sale.customer.id);
    setUseCustomSoldAt(true);
    setSoldAt(sale.soldAt.slice(0, 10));
    setDueDate(sale.dueDate ? sale.dueDate.slice(0, 10) : "");
    setNotes(sale.notes ?? "");
  }, [sale]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          useCustomSoldAt,
          soldAt: useCustomSoldAt ? soldAt : "",
          dueDate: isCredit ? dueDate : "",
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível salvar a venda", { description: data.message });
        return;
      }
      toast.success("Venda atualizada com sucesso.");
      onSaved();
      onClose();
    } catch {
      toast.error("Erro ao salvar a venda.");
    } finally {
      setSaving(false);
    }
  }

  if (!shouldRender || !mounted || !sale) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Editar venda</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {sale.branch.name} · {formatPaymentMethod(sale.paymentMethod)} ·{" "}
              {formatCurrency(sale.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--panel)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Itens (somente leitura)</p>
            <ul className="mt-2 space-y-1">
              {sale.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.product.name} —{" "}
                  {formatCurrency(String(item.total))}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Registrada em {formatDateTime(sale.soldAt)}
            </p>
          </div>

          {showCustomerPicker ? (
            <div className="mt-4">
              <label className="text-sm font-medium text-[var(--foreground)]">Cliente</label>
              <CustomerSearchInput
                customers={customers}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Buscar cliente…"
                className="mt-2"
              />
            </div>
          ) : null}

          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={useCustomSoldAt}
                onChange={(e) => setUseCustomSoldAt(e.target.checked)}
                className="rounded border-[var(--border-strong)]"
              />
              Alterar data da venda
            </label>
            {useCustomSoldAt ? (
              <DatePicker
                value={soldAt}
                onChange={setSoldAt}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-2"
              />
            ) : null}
          </div>

          {isCredit ? (
            <div className="mt-4">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Vencimento (fiado)
              </label>
              <DatePicker value={dueDate} onChange={setDueDate} className="mt-2" />
            </div>
          ) : null}

          <div className="mt-4">
            <label className="text-sm font-medium text-[var(--foreground)]">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              className="mt-2"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
