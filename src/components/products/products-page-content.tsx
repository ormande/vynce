"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, PackageSearch, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ProductDetailModal } from "./product-detail-modal";

type Product = {
  id: string;
  name: string;
  code: string | null;
  salePrice: any;
  costPrice: any;
  minPrice: any;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "ACTIVE" | "INACTIVE";
  category: {
    id: string;
    name: string;
  };
  description: string | null;
};

export function ProductsPageContent({
  products,
  categories,
  total,
  totalPages,
  page,
  canWrite,
  roleSlug,
}: {
  products: Product[];
  categories: { id: string; name: string }[];
  total: number;
  totalPages: number;
  page: number;
  canWrite: boolean;
  roleSlug?: string | null;
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {total} produto(s) cadastrado(s).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {canWrite && (
            <ActionButton href="/products/categories" icon={Tag} variant="secondary">
              Categorias
            </ActionButton>
          )}
          {canWrite && (
            <ActionButton href="/products/new" icon={Plus}>
              Adicionar produto
            </ActionButton>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--muted-foreground)]">
            <PackageSearch className="h-10 w-10 opacity-40" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
            Nenhum produto cadastrado ainda.
          </h3>
          <p className="mt-2 max-w-xs text-[var(--muted-foreground)]">
            Comece adicionando seu primeiro produto ao catálogo para gerenciar estoque e vendas.
          </p>
          {canWrite && (
            <ActionButton href="/products/new" icon={Plus} className="mt-8">
              Adicionar primeiro produto
            </ActionButton>
          )}
        </Card>
      ) : (
        <>
          <Card className="mt-6">
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
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="group cursor-pointer rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md text-center"
                  >
                    <td className="rounded-l-3xl px-4 py-4 text-left">
                      <p className="font-medium text-[var(--foreground)]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {product.code || "Sem código"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {formatCurrency(product.salePrice.toString())}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--foreground)]">
                      {product.stockQuantity}
                    </td>
                    <td className="rounded-r-3xl px-4 py-4 text-right">
                      <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                        {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">
              <p className="text-sm text-[var(--muted-foreground)]">
                Página <span className="font-medium text-[var(--foreground)]">{page}</span> de{" "}
                <span className="font-medium text-[var(--foreground)]">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={`/products?page=${page - 1}`} className="inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)] cursor-pointer">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Link>
                ) : (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                )}
                {page < totalPages ? (
                  <Link href={`/products?page=${page + 1}`} className="inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)] cursor-pointer">
                    Próximo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                ) : (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled
                  >
                    Próximo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          roleSlug={roleSlug}
          categories={categories}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
