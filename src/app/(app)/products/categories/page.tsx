import { AppShell } from "@/components/layout/app-shell";
import { CategoriesPageContent } from "@/components/categories/categories-page-content";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/auth-guards";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { getCategoriesForManagement } from "@/modules/products/category-service";

export const dynamic = "force-dynamic";

export default async function ProductCategoriesPage() {
  await requirePermission(permissionCatalog.productsRead);

  const session = await auth();
  const canWrite = hasPermission(
    session?.user.permissions,
    permissionCatalog.productsWrite,
  );

  const categories = await getCategoriesForManagement();

  return (
    <AppShell
      title="Categorias de produtos"
      subtitle="Organize o catálogo com categorias personalizáveis para facilitar buscas e relatórios."
      pathname="/products"
    >
      <CategoriesPageContent categories={categories} canWrite={canWrite} />
    </AppShell>
  );
}
