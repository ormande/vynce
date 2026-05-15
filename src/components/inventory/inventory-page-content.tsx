"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate, formatMovementType, cn } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  code: string | null;
  categoryName: string;
  salePrice: any;
  stockQuantity: number;
  status: string;
};

type LowStockItem = {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  branchName: string | null;
};

type Movement = {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  createdAt: string;
  product: { name: string };
  branch: { name: string } | null;
};

export function InventoryPageContent({
  items,
  total,
  totalPages,
  page,
  lowStock,
  movements,
  branches,
  currentBranch,
}: {
  items: InventoryItem[];
  total: number;
  totalPages: number;
  page: number;
  lowStock: LowStockItem[];
  movements: Movement[];
  branches: { id: string; name: string }[];
  currentBranch: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex space-x-2 overflow-x-auto border-b border-[var(--border)] pb-2">
        {branches.map((b) => (
          <Link
            key={b.id}
            href={`/inventory?branch=${b.id}`}
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
              currentBranch === b.id
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
            )}
          >
            {b.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-6">
        {items.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--muted-foreground)]">
              <PackageSearch className="h-10 w-10 opacity-40" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
              Nenhum produto em estoque.
            </h3>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">
                Itens no catálogo
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {total} produto(s)
              </p>
            </div>
            <Table>
              <thead>
                <tr className="text-center text-sm text-[var(--muted-foreground)]">
                  <th className="px-4 py-2 text-left">Produto</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Preço sugerido</th>
                  <th className="px-4 py-2">Estoque</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md text-center"
                  >
                    <td className="rounded-l-3xl px-4 py-4 text-left">
                      <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {item.code || "Sem código"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {item.categoryName}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {formatCurrency(item.salePrice.toString())}
                    </td>
                    <td className="px-4 py-4 font-bold text-[var(--foreground)]">
                      {item.stockQuantity}
                    </td>
                    <td className="rounded-r-3xl px-4 py-4 text-right">
                      <Badge tone={item.status === "ACTIVE" ? "success" : "neutral"}>
                        {item.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-6 mt-6">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Página <span className="font-medium text-[var(--foreground)]">{page}</span> de{" "}
                  <span className="font-medium text-[var(--foreground)]">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/inventory?branch=${currentBranch}&page=${page - 1}`}
                      className="inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)] cursor-pointer"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                    </Link>
                  ) : (
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                    </Button>
                  )}
                  {page < totalPages ? (
                    <Link
                      href={`/inventory?branch=${currentBranch}&page=${page + 1}`}
                      className="inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)] cursor-pointer"
                    >
                      Próximo <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  ) : (
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled>
                      Próximo <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Itens com estoque baixo</h3>
            <div className="mt-5 space-y-3">
              {lowStock.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">Tudo certo, nenhum item com estoque baixo no momento.</p>
              ) : (
                lowStock.map((row) => (
                  <div key={row.id} className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)]">{row.name}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">mínimo {row.lowStockThreshold} un.</p>
                        {row.branchName && (
                          <p className="text-sm text-[var(--muted-foreground)]">{row.branchName}</p>
                        )}
                      </div>
                      <Badge tone="warning">{row.stockQuantity} un.</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Últimas movimentações</h3>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <thead>
                  <tr className="text-center text-sm text-[var(--muted-foreground)]">
                    <th className="px-4 py-2 text-left">Produto</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Qtd</th>
                    <th className="px-4 py-2 text-right">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-3">
                            <Activity className="h-6 w-6 opacity-40" />
                          </div>
                          <p>Nenhuma movimentação registrada.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    movements.map((movement) => (
                      <tr key={movement.id} className="rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md text-center">
                        <td className="rounded-l-3xl px-4 py-3 font-medium text-[var(--foreground)] text-left">
                          {movement.product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                          {formatMovementType(movement.type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] font-medium">
                          <span className={movement.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
                            {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                          </span>
                        </td>
                        <td className="rounded-r-3xl px-4 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap text-right">
                          {formatDate(movement.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
