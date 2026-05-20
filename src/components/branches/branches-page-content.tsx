"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { AlertCircle, Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Input } from "@/components/ui/input";
import {
  deleteBranchAction,
  updateBranchAction,
} from "@/modules/branches/actions";
import {
  branchEditFormSchema,
  type BranchEditFormInput,
} from "@/modules/branches/schemas";
import type { z } from "zod";

type BranchEditFormValues = z.input<typeof branchEditFormSchema>;

export type BranchCardModel = {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  isWarehouse: boolean;
  zeroStockProductCount: number;
};

export function BranchesPageContent({
  branches,
  canWrite,
}: {
  branches: BranchCardModel[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<BranchCardModel | null>(null);
  const [deleting, setDeleting] = useState<BranchCardModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<BranchEditFormValues, undefined, BranchEditFormInput>({
    resolver: zodResolver(branchEditFormSchema),
    defaultValues: { name: "", address: "" },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        address: editing.address ?? "",
      });
    }
  }, [editing, form]);

  useEffect(() => {
    if (!editing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setEditing(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editing]);

  async function onSubmitEdit(values: BranchEditFormInput) {
    if (!editing) return;
    const result = await updateBranchAction(editing.id, {
      name: values.name,
      address: values.address?.trim() ? values.address.trim() : "",
    });
    if (!result.ok) {
      form.setError("root", { message: result.message });
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteBranchAction(deleting.id);
      if (!result.ok) {
        toast.error("Não foi possível excluir a unidade", {
          description: result.message,
        });
        return;
      }
      if (result.migratedProducts > 0) {
        toast.success(`Unidade "${result.deletedBranchName}" excluída`, {
          description: `Estoque de ${result.migratedProducts} produto(s) foi movido para ${result.warehouseName}.`,
        });
      } else {
        toast.success(`Unidade "${result.deletedBranchName}" excluída`);
      }
      setDeleting(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {branches.length} unidade(s) cadastrada(s).
        </p>
        {canWrite ? (
          <ActionButton href="/branches/new" icon={Plus}>
            Nova unidade
          </ActionButton>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 overflow-visible p-1 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            className="group relative flex min-h-[200px] flex-col overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
          >
            <Link
              href={`/branches/${branch.id}`}
              className="absolute inset-0 z-0 cursor-pointer rounded-[28px]"
              aria-label={`Abrir detalhes de ${branch.name}`}
            />
            <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{branch.name}</h3>
                      {branch.address ? (
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{branch.address}</p>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sem endereço cadastrado</p>
                      )}
                    </div>
                  </div>
                  {canWrite ? (
                    <div className="relative z-20 flex shrink-0 items-center gap-2 pointer-events-auto">
                      <button
                        type="button"
                        title="Editar unidade"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditing(branch);
                        }}
                        className="cursor-pointer rounded-full border border-[var(--border-strong)] bg-white/90 p-2.5 text-[var(--foreground)] shadow-sm transition hover:bg-[var(--panel-strong)]"
                        aria-label="Editar unidade"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Excluir unidade"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleting(branch);
                        }}
                        className="cursor-pointer rounded-full border border-rose-200 bg-white/90 p-2.5 text-rose-600 shadow-sm transition hover:bg-rose-50"
                        aria-label="Excluir unidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={branch.isActive ? "success" : "neutral"}>
                    {branch.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                  {branch.isWarehouse ? (
                    <Badge tone="warning">Depósito central</Badge>
                  ) : (
                    <Badge tone="neutral">Loja / ponto</Badge>
                  )}
                </div>
              </div>
              {branch.zeroStockProductCount > 0 ? (
                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-amber-800/90">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  <span>
                    {branch.zeroStockProductCount} produto(s) sem estoque
                  </span>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <ConfirmationModal
        isOpen={!!deleting}
        onClose={() => {
          if (!isDeleting) setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Excluir "${deleting?.name ?? ""}"?`}
        description={
          deleting?.isWarehouse
            ? "Esta unidade está marcada como depósito central. A exclusão só será permitida se houver outra unidade-depósito ativa para receber o estoque."
            : "Todo o estoque desta unidade será movido para o depósito central antes da exclusão. A unidade não pode ter vendas nem transferências registradas."
        }
        confirmLabel={isDeleting ? "Excluindo…" : "Excluir unidade"}
        cancelLabel="Cancelar"
        variant="danger"
        loading={isDeleting}
      />

      {editing
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
              role="presentation"
              onClick={() => setEditing(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="branch-edit-title"
                className="relative w-full max-w-md rounded-[28px] border border-white/20 bg-[var(--panel-strong)] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  id="branch-edit-title"
                  className="font-serif text-2xl font-semibold text-[var(--foreground)]"
                >
                  Editar unidade
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Atualize o nome e o endereço exibidos no sistema.
                </p>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={form.handleSubmit(onSubmitEdit)}
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                      Nome <span className="text-rose-700">*</span>
                    </label>
                    <Input {...form.register("name")} />
                    {form.formState.errors.name ? (
                      <p className="mt-1 text-xs text-rose-700">
                        {form.formState.errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                      Endereço
                    </label>
                    <Input placeholder="Rua, número, bairro" {...form.register("address")} />
                  </div>

                  {form.formState.errors.root ? (
                    <p className="text-sm text-rose-700">{form.formState.errors.root.message}</p>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditing(null)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
