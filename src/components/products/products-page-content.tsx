"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, PackageSearch, Tag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
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
  const [productList, setProductList] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleStatus(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    if (togglingId) return;
    setTogglingId(product.id);
    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Erro ao alterar status", { description: data.message });
        return;
      }
      toast.success(
        newStatus === "ACTIVE" ? "Produto reativado." : "Produto inativado.",
      );
      setProductList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)),
      );
    } catch {
      toast.error("Não foi possível alterar o status.");
    } finally {
      setTogglingId(null);
    }
  }

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
                {productList.map((product) => (
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
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(e, product)}
                          disabled={togglingId === product.id}
                          title={
                            product.status === "ACTIVE"
                              ? "Clique para inativar"
                              : "Clique para reativar"
                          }
                          className="transition-opacity disabled:opacity-50"
                        >
                          <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                            {togglingId === product.id
                              ? "…"
                              : product.status === "ACTIVE"
                                ? "Ativo"
                                : "Inativo"}
                          </Badge>
                        </button>
                      ) : (
                        <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                          {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <TablePagination page={page} totalPages={totalPages} hrefBase="/products" />
        </>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={productList.find((p) => p.id === selectedProduct.id) ?? selectedProduct}
          roleSlug={roleSlug}
          categories={categories}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
