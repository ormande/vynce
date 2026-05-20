"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Power, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  CategoryFormModal,
  type CategoryRow,
} from "@/components/categories/category-form-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { ClientTablePagination } from "@/components/ui/client-table-pagination";
import { paginateArray } from "@/lib/pagination";

export function CategoriesPageContent({
  categories: initialCategories,
  canWrite,
}: {
  categories: CategoryRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<CategoryRow | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [page, setPage] = useState(1);

  const paginated = useMemo(
    () => paginateArray(categories, page),
    [categories, page],
  );

  useEffect(() => {
    if (page > paginated.totalPages) {
      setPage(1);
    }
  }, [categories.length, page, paginated.totalPages]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditing(category);
    setFormOpen(true);
  }

  async function refreshCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (res.ok && data.categories) {
      setCategories(data.categories);
    }
    router.refresh();
  }

  async function handleDeactivate() {
    if (!confirmTarget) return;

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/categories/${confirmTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Erro ao remover categoria", { description: data.message });
        return;
      }

      const hadProducts = confirmTarget.productCount > 0;
      toast.success(
        hadProducts
          ? "Categoria desativada. Produtos vinculados permanecem no catálogo."
          : "Categoria removida com sucesso!",
      );
      setConfirmTarget(null);
      await refreshCategories();
    } catch {
      toast.error("Não foi possível concluir a operação.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleReactivate(category: CategoryRow) {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Erro ao reativar categoria", { description: data.message });
        return;
      }

      toast.success("Categoria reativada com sucesso!");
      await refreshCategories();
    } catch {
      toast.error("Não foi possível reativar a categoria.");
    } finally {
      setLoadingAction(false);
    }
  }

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para produtos
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {activeCount} categoria(s) ativa(s) de {categories.length} cadastrada(s).
        </p>
        {canWrite && (
          <ActionButton onClick={openCreate} icon={Plus}>
            Nova categoria
          </ActionButton>
        )}
      </div>

      {categories.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--muted-foreground)]">
            <Tag className="h-10 w-10 opacity-40" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
            Nenhuma categoria cadastrada
          </h3>
          <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Crie categorias para organizar o catálogo de produtos.
          </p>
          {canWrite && (
            <ActionButton onClick={openCreate} icon={Plus} className="mt-6">
              Criar primeira categoria
            </ActionButton>
          )}
        </Card>
      ) : (
        <Card className="mt-6">
          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-center">Nome</th>
                <th className="px-4 py-2 text-center">Descrição</th>
                <th className="px-4 py-2 text-center">Produtos</th>
                <th className="px-4 py-2 text-center">Status</th>
                {canWrite && (
                  <th className="px-4 py-2 text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.items.map((category) => (
                <tr
                  key={category.id}
                  className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
                >
                  <td className="rounded-l-3xl px-4 py-4 text-center font-medium text-[var(--foreground)]">
                    {category.name}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
                    {category.description || "—"}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-[var(--foreground)]">
                    {category.productCount}
                  </td>
                  <td className={cn("px-4 py-4 text-center", !canWrite && "rounded-r-3xl")}>
                    <Badge tone={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  {canWrite && (
                    <td className="rounded-r-3xl px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-full px-3 py-2"
                          onClick={() => openEdit(category)}
                          disabled={loadingAction}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {category.isActive ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-full px-3 py-2 text-rose-600 hover:text-rose-700"
                            onClick={() => setConfirmTarget(category)}
                            disabled={loadingAction}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-full px-3 py-2"
                            onClick={() => handleReactivate(category)}
                            disabled={loadingAction}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          <ClientTablePagination
            page={paginated.page}
            totalPages={paginated.totalPages}
            onPageChange={setPage}
          />
        </Card>
      )}

      <CategoryFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        onSaved={refreshCategories}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDeactivate}
        title={
          confirmTarget && confirmTarget.productCount > 0
            ? "Desativar categoria?"
            : "Remover categoria?"
        }
        description={
          confirmTarget && confirmTarget.productCount > 0
            ? `A categoria "${confirmTarget.name}" possui ${confirmTarget.productCount} produto(s) vinculado(s). Ela será desativada e não aparecerá em novos cadastros, mas os produtos existentes permanecem.`
            : `A categoria "${confirmTarget?.name}" será removida permanentemente. Esta ação não pode ser desfeita.`
        }
        confirmLabel={
          confirmTarget && confirmTarget.productCount > 0 ? "Desativar" : "Remover"
        }
        variant="danger"
        loading={loadingAction}
      />
    </>
  );
}
