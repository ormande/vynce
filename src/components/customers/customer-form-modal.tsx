"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCpfMask,
  formatPhoneMask,
  onlyDigits,
} from "@/lib/utils";
import { useAnimatedModal } from "@/lib/use-animated-modal";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  address: string | null;
  notes: string | null;
  purchaseHistoryCount: number;
  outstandingBalance: number;
};

export function CustomerFormModal({
  isOpen,
  onClose,
  onSaved,
  customer,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  customer?: CustomerRow | null;
}) {
  const isEditing = Boolean(customer);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ? formatPhoneMask(customer.phone) : "");
      setCpf(customer.cpf ? formatCpfMask(customer.cpf) : "");
      setAddress(customer.address ?? "");
      setNotes(customer.notes ?? "");
    } else {
      setName("");
      setPhone("");
      setCpf("");
      setAddress("");
      setNotes("");
    }
  }, [isOpen, customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const phoneDigits = onlyDigits(phone);
    const cpfDigits = onlyDigits(cpf);

    if (trimmedName.length < 3) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    if (phoneDigits.length > 0 && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
      toast.error("Se informar o telefone, use DDD (10 ou 11 dígitos).");
      return;
    }

    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos.");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/api/customers/${customer!.id}` : "/api/customers";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phoneDigits,
          cpf: cpfDigits,
          address: address.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          isEditing ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente",
          { description: data.message },
        );
        return;
      }

      toast.success(
        isEditing ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!",
      );
      onSaved();
      onClose();
    } catch {
      toast.error("Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] flex flex-col max-h-[90vh] ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              {isEditing ? "Editar cliente" : "Novo cliente"}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isEditing
                ? "Atualize os dados de contato e informações do cliente."
                : "Cadastre clientes para vendas fiado e histórico de compras."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo ou razão social"
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)]">
                Telefone <span className="text-[var(--muted-foreground)]">(opcional)</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)]">
                CPF <span className="text-[var(--muted-foreground)]">(opcional)</span>
              </label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(formatCpfMask(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Endereço <span className="text-[var(--muted-foreground)]">(opcional)</span>
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Observações <span className="text-[var(--muted-foreground)]">(opcional)</span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferências de contato, referências, etc."
                className="mt-2 min-h-[96px]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
