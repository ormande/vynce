import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Package } from "lucide-react";

import { ProductForm } from "@/components/forms/product-form";
import { AppShell } from "@/components/layout/app-shell";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { requirePermission } from "@/lib/auth-guards";
import { permissionCatalog } from "@/lib/permissions";
import { getActiveCategories } from "@/modules/products/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "owner") {
    redirect("/products");
  }
  
  await requirePermission(permissionCatalog.productsWrite);

  const [snapshot, settings, categories] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getActiveCategories(),
  ]);

  const setupBlock = resolveSetupBlock("products-new", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return (
    <AppShell
      title="Novo produto"
      subtitle="Cadastre um novo item no catálogo com preço, categoria e estoque inicial."
      pathname="/products"
    >
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista
        </Link>
      </div>

      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={Package} />
      ) : (
        <div className="w-full">
          <ProductForm
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
          />
        </div>
      )}
    </AppShell>
  );
}
