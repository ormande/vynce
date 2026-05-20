import { Package } from "lucide-react";

import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getProducts, getActiveCategories } from "@/modules/products/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";
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

  const [snapshot, settings, productsResult, categories] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getProducts({
      page,
      pageSize: 10,
      status: "ALL",
      search,
    }),
    getActiveCategories(),
  ]);

  const setupBlock = resolveSetupBlock("products", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  const { items: rawProducts, total, totalPages } = productsResult;

  const products = rawProducts.map((p) => ({
    ...p,
    salePrice: p.salePrice.toString(),
    costPrice: p.costPrice.toString(),
    minPrice: p.minPrice.toString(),
  }));

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={Package} />
  ) : (
      <ProductsPageContent 
        products={products}
        categories={categories}
        total={total}
        totalPages={totalPages}
        page={page}
        canWrite={canWrite}
        roleSlug={session?.user.roleSlug}
      />
  );
}
