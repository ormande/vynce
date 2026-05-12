import { ProductForm } from "@/components/forms/product-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getProducts, getActiveCategories } from "@/modules/products/service";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts({ status: "ALL" }),
    getActiveCategories(),
  ]);

  return (
    <AppShell
      title="Produtos"
      subtitle="Gestão centralizada de catálogo, categorias personalizáveis, preços e status operacional."
      pathname="/products"
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <ProductForm
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
        />
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Catálogo de produtos
            </h3>
          </div>
          <Table>
            <thead>
              <tr className="text-left text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Preço sugerido</th>
                <th className="px-4 py-2">Piso mínimo</th>
                <th className="px-4 py-2">Estoque</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="rounded-3xl bg-[var(--panel-strong)]">
                  <td className="rounded-l-3xl px-4 py-4">
                    <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{product.code}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {product.category.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatCurrency(product.salePrice.toString())}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatCurrency(product.minPrice.toString())}
                  </td>
                  <td className="px-4 py-4 font-medium text-[var(--foreground)]">
                    {product.stockQuantity}
                  </td>
                  <td className="rounded-r-3xl px-4 py-4">
                    <Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                      {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
