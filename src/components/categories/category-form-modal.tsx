"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAnimatedModal } from "@/lib/use-animated-modal";

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
};

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryRow | null;
  onSaved: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(category);

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
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
  }, [isOpen, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
      };

      const res = await fetch(
        isEditing ? `/api/categories/${category!.id}` : "/api/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(isEditing ? "Erro ao atualizar categoria" : "Erro ao criar categoria", {
          description: data.message,
        });
        return;
      }

      toast.success(
        isEditing ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!",
      );
      onSaved();
      onClose();
    } catch {
      toast.error("Não foi possível salvar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              {isEditing ? "Editar categoria" : "Nova categoria"}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isEditing
                ? "Atualize o nome e a descrição exibidos no catálogo."
                : "Crie uma categoria para organizar os produtos."}
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

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Acessórios"
              className="mt-2"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">
              Descrição <span className="text-[var(--muted-foreground)]">(opcional)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição para referência interna"
              className="mt-2 min-h-[96px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] -mx-6 px-6 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
