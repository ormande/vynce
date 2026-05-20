"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { ProductForm } from "@/components/forms/product-form";
import { formatCurrency } from "@/lib/utils";

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

export function ProductDetailModal({
  product,
  roleSlug,
  categories,
  onClose,
}: {
  product: Product;
  roleSlug?: string | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");

  const isOwner = roleSlug === "owner";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-overlay-in"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/20 bg-[var(--panel-strong)] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.35)] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-semibold text-[var(--foreground)]">
            {mode === "view" ? "Detalhes do produto" : "Editar produto"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "view" ? (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <DetailField label="Nome" value={product.name} fullWidth />
              <DetailField label="Código" value={product.code || "Não informado"} />
              <DetailField label="Categoria" value={product.category.name} />
              <DetailField 
                label="Status" 
                value={
                  <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                    {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </Badge>
                } 
              />
              <DetailField 
                label="Preço de custo" 
                value={formatCurrency(product.costPrice.toString())} 
              />
              <DetailField 
                label="Preço sugerido" 
                value={formatCurrency(product.salePrice.toString())} 
              />
              <DetailField 
                label="Preço mínimo" 
                value={formatCurrency(product.minPrice.toString())} 
              />
              <DetailField label="Estoque atual" value={product.stockQuantity} />
              <DetailField label="Estoque mínimo" value={product.lowStockThreshold} />
            </div>

            {product.description && (
              <DetailField label="Descrição" value={product.description} fullWidth />
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              {isOwner && (
                <ActionButton 
                  icon={Pencil} 
                  onClick={() => setMode("edit")}
                >
                  Editar produto
                </ActionButton>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ProductForm 
              categories={categories}
              initialValues={{
                ...product,
                categoryId: product.category.id,
                costPrice: formatCurrency(product.costPrice.toString()),
                salePrice: formatCurrency(product.salePrice.toString()),
                minPrice: formatCurrency(product.minPrice.toString()),
                stockQuantity: product.stockQuantity.toString(),
                lowStockThreshold: product.lowStockThreshold.toString(),
                status: product.status,
                code: product.code || "",
                description: product.description || "",
              }}
              onSuccess={() => {
                setMode("view");
                router.refresh();
              }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function DetailField({ 
  label, 
  value, 
  fullWidth = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2 lg:col-span-3 xl:col-span-4" : ""}>
      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold mb-1 whitespace-nowrap">
        {label}
      </p>
      <div className="text-[var(--foreground)] font-medium">
        {value}
      </div>
    </div>
  );
}
