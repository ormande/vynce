import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { getInventorySnapshot } from "@/modules/inventory/service";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventory = await getInventorySnapshot();

  return (
    <AppShell
      title="Estoque"
      subtitle="Monitoramento de quantidade disponível, itens críticos e últimas movimentações registradas."
      pathname="/inventory"
    >
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Itens com estoque baixo
          </h3>
          <div className="mt-5 space-y-3">
            {inventory.lowStock.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      mínimo {product.lowStockThreshold} un.
                    </p>
                  </div>
                  <Badge tone="warning">{product.stockQuantity} un.</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Últimas movimentações
          </h3>
          <Table className="mt-4">
            <thead>
              <tr className="text-left text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Quantidade</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {inventory.movements.map((movement) => (
                <tr key={movement.id} className="rounded-3xl bg-[var(--panel-strong)]">
                  <td className="rounded-l-3xl px-4 py-4 font-medium text-[var(--foreground)]">
                    {movement.product.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {movement.type}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {movement.quantity}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {movement.previousStock} → {movement.currentStock}
                  </td>
                  <td className="rounded-r-3xl px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatDate(movement.createdAt)}
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
