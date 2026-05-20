"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAnimatedModal } from "@/lib/use-animated-modal";

type ProductOption = {
  id: string;
  name: string;
};

type BranchOption = {
  id: string;
  name: string;
};

const numberInputClassName =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function AddStockModal({
  isOpen,
  onClose,
  branches,
  products,
  defaultBranchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchOption[];
  products: ProductOption[];
  defaultBranchId: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (isOpen) {
      setBranchId(defaultBranchId);
      setProductId(products[0]?.id ?? "");
      setQuantity("");
      setNote("");
    }
  }, [isOpen, defaultBranchId, products]);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches],
  );

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedQty = quantity === "" ? 0 : Number(quantity);
    if (!branchId || !productId || !parsedQty || parsedQty < 1) {
      toast.error("Preencha unidade, produto e quantidade válida.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/inventory/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          productId,
          quantity: parsedQty,
          note,
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error("Erro ao adicionar estoque", { description: data.message });
        return;
      }

      toast.success("Estoque adicionado com sucesso!");
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível adicionar estoque.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative flex w-full max-w-lg max-h-[90vh] flex-col rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Adicionar estoque</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Entrada de mercadoria na unidade selecionada.
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Unidade
            </label>
            <DropdownSelect
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              placeholder="Selecione a unidade"
              disabled={branchOptions.length === 0}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Produto
            </label>
            <DropdownSelect
              value={productId}
              onChange={setProductId}
              options={productOptions}
              placeholder="Selecione o produto"
              disabled={productOptions.length === 0}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Quantidade
            </label>
            <Input
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val === "" ? "" : Number(val));
              }}
              className={numberInputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Observação (opcional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: reposição do fornecedor"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !branchId || !productId}>
              Confirmar entrada
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
