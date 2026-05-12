import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getInventorySnapshot } from "@/modules/inventory/service";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await auth();
  const isSeller = session?.user?.roleSlug === "seller";
  const branchIds = session?.user?.branchIds ?? [];
  const snapshot = await getInventorySnapshot(
    isSeller && branchIds.length > 0 ? { branchIds } : undefined,
  );

  return (
    <AppShell
      title="Estoque"
      subtitle={
        snapshot.mode === "branch"
          ? "Visão da sua unidade: itens críticos e movimentações apenas desta filial."
          : "Monitoramento de quantidade disponível, itens críticos e últimas movimentações registradas."
      }
      pathname="/inventory"
    >
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Itens com estoque baixo
          </h3>
          <div className="mt-5 space-y-3">
            {snapshot.lowStock.map((row) => (
              <div
                key={row.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)]">{row.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      mínimo {row.lowStockThreshold} un.
                    </p>
                    {"branchName" in row && row.branchName ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{row.branchName}</p>
                    ) : null}
                  </div>
                  <Badge tone="warning">{row.stockQuantity} un.</Badge>
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
                <th className="px-4 py-2">Unidade</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Quantidade</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.movements.map((movement) => (
                <tr key={movement.id} className="rounded-3xl bg-[var(--panel-strong)]">
                  <td className="rounded-l-3xl px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {movement.branch?.name ?? "—"}
                  </td>
                  <td className="px-4 py-4 font-medium text-[var(--foreground)]">
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
