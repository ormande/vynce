import { Plus, ChevronLeft, ChevronRight, PackageSearch, ArrowLeftRight } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getProducts, getActiveCategories } from "@/modules/products/service";
import { auth } from "@/lib/auth";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { ProductsPageContent } from "@/components/products/products-page-content";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  const canWrite = hasPermission(
    session?.user.permissions,
    permissionCatalog.productsWrite,
  );

  const { page: pageStr, q } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const search = q?.trim() || undefined;

  const [{ items: rawProducts, total, totalPages }, categories] = await Promise.all([
    getProducts({
      page,
      pageSize: 20,
      status: "ALL",
      search,
    }),
    getActiveCategories(),
  ]);

  const products = rawProducts.map((p) => ({
    ...p,
    salePrice: p.salePrice.toString(),
    costPrice: p.costPrice.toString(),
    minPrice: p.minPrice.toString(),
  }));

  return (
    <AppShell
      title="Produtos"
      subtitle="Gestão centralizada de catálogo, categorias personalizáveis, preços e status operacional."
      pathname="/products"
    >
      <ProductsPageContent 
        products={products}
        categories={categories}
        total={total}
        totalPages={totalPages}
        page={page}
        canWrite={canWrite}
        roleSlug={session?.user.roleSlug}
      />
    </AppShell>
  );
}
