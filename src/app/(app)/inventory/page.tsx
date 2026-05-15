import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { getInventorySnapshot } from "@/modules/inventory/service";
import { listActiveBranches } from "@/modules/branches/service";
import { InventoryPageContent } from "@/components/inventory/inventory-page-content";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; page?: string }>;
}) {
  const session = await auth();
  const isOwner = session?.user?.roleSlug === "owner";
  const userBranchIds = session?.user?.branchIds ?? [];

  const allBranches = await listActiveBranches();
  const allowedBranches = isOwner
    ? allBranches
    : allBranches.filter((b) => userBranchIds.includes(b.id));

  const { branch: branchParam, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);

  let currentBranch = branchParam;
  
  if (!currentBranch) {
    if (isOwner) {
      currentBranch = "global";
    } else {
      currentBranch = allowedBranches[0]?.id || "global";
    }
  }

  const tabs = [];
  if (isOwner) {
    tabs.push({ id: "global", name: "Visão Geral" });
  }
  tabs.push(...allowedBranches.map(b => ({ id: b.id, name: b.name })));

  const snapshot = await getInventorySnapshot({
    branchId: currentBranch,
    page,
    pageSize: 10,
  });

  return (
    <AppShell
      title="Estoque"
      subtitle="Monitoramento de quantidades disponíveis, itens críticos e últimas movimentações."
      pathname="/inventory"
    >
      <InventoryPageContent
        items={snapshot.items.map((item) => ({
          ...item,
          salePrice: item.salePrice.toString(),
        }))}
        total={snapshot.total}
        totalPages={snapshot.totalPages}
        page={snapshot.page}
        lowStock={snapshot.lowStock}
        movements={snapshot.movements.map((movement) => ({
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          previousStock: movement.previousStock,
          currentStock: movement.currentStock,
          createdAt: movement.createdAt.toISOString(),
          product: { name: movement.product.name },
          branch: movement.branch ? { name: movement.branch.name } : null,
        }))}
        branches={tabs}
        currentBranch={currentBranch}
      />
    </AppShell>
  );
}
