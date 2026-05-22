"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { useAnimatedModal } from "@/lib/use-animated-modal";
import { formatCurrency } from "@/lib/utils";
import type { ReceivableRow } from "@/components/receivables/receivables-page-content";

export function ReceivableEditModal({
  isOpen,
  onClose,
  receivable,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  receivable: ReceivableRow | null;
  onSaved: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!receivable) return;
    const d =
      receivable.dueDate instanceof Date
        ? receivable.dueDate
        : new Date(receivable.dueDate);
    setDueDate(d.toISOString().slice(0, 10));
    setNotes(receivable.notes ?? "");
  }, [receivable]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receivable) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/receivables/${receivable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível salvar o título", { description: data.message });
        return;
      }
      toast.success("Título atualizado com sucesso.");
      onSaved();
      onClose();
    } catch {
      toast.error("Erro ao salvar o título.");
    } finally {
      setSaving(false);
    }
  }

  if (!shouldRender || !mounted || !receivable) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Editar título
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {receivable.customer.name} · Saldo {formatCurrency(receivable.balanceDue)}
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
          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">
              Data de vencimento
            </label>
            <DatePicker value={dueDate} onChange={setDueDate} className="mt-2" />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Observações
            </label>
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
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
