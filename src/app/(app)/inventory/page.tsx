import { Boxes } from "lucide-react";

import { InventoryPageContent } from "@/components/inventory/inventory-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { permissionCatalog } from "@/lib/permissions";
import { listActiveBranches } from "@/modules/branches/service";
import { getInventorySnapshot } from "@/modules/inventory/service";
import { getProducts } from "@/modules/products/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; page?: string }>;
}) {
  const session = await auth();
  const isOwner = session?.user?.roleSlug === "owner";
  const userBranchIds = session?.user?.branchIds ?? [];

  const [setupSnapshot, settings, allBranches] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    listActiveBranches(),
  ]);

  const setupBlock = resolveSetupBlock("inventory", setupSnapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  const allowedBranches = isOwner
    ? allBranches
    : allBranches.filter((b) => userBranchIds.includes(b.id));

  const { branch: branchParam, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);

  let currentBranch = branchParam;
  
  if (!currentBranch) {
    if (isOwner && !settings.singleUnitMode) {
      currentBranch = "global";
    } else {
      currentBranch = allowedBranches[0]?.id || "global";
    }
  }

  if (settings.singleUnitMode && currentBranch === "global") {
    currentBranch = allowedBranches[0]?.id ?? "global";
  }

  const tabs = [];
  if (isOwner && !settings.singleUnitMode) {
    tabs.push({ id: "global", name: "Visão Geral" });
  }
  tabs.push(...allowedBranches.map(b => ({ id: b.id, name: b.name })));

  const [inventorySnapshot, productsResult] = await Promise.all([
    getInventorySnapshot({
      branchId: currentBranch,
      page,
      pageSize: 10,
    }),
    getProducts({ status: "ACTIVE", pageSize: 500 }),
  ]);

  const canAddStock = hasPermission(
    session?.user?.permissions ?? [],
    permissionCatalog.inventoryWrite,
  );

  const stockBranches = allowedBranches.map((b) => ({ id: b.id, name: b.name }));

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={Boxes} />
  ) : (
      <InventoryPageContent
        items={inventorySnapshot.items.map((item) => ({
          ...item,
          salePrice: item.salePrice.toString(),
        }))}
        total={inventorySnapshot.total}
        totalPages={inventorySnapshot.totalPages}
        page={inventorySnapshot.page}
        lowStock={inventorySnapshot.lowStock}
        movements={inventorySnapshot.movements.map((movement) => ({
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
        stockBranches={stockBranches}
        products={productsResult.items.map((p) => ({ id: p.id, name: p.name }))}
        canAddStock={canAddStock}
        singleUnitMode={settings.singleUnitMode}
      />
  );
}
