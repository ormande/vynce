import { redirect } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";

import { requirePermission } from "@/lib/auth-guards";
import { permissionCatalog } from "@/lib/permissions";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { listActiveBranches } from "@/modules/branches/service";
import {
  listAllTransfersForAdmin,
  listMyRequestedTransfers,
  listPendingInboundForBranches,
  listAllTransfersForBranches,
  getUnseenPendingTransfersCount,
} from "@/modules/transfers/service";
import { TransfersPageContent } from "@/components/transfers/transfers-page-content";
import type { StockTransferWithRelations } from "@/modules/transfers/repository";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const session = await requirePermission(permissionCatalog.transfersRead);
  const params = await searchParams;
  const isOwner = session.user.roleSlug === "owner";
  const branchIds = session.user.branchIds ?? [];

  const [snapshot, settings] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
  ]);

  if (settings.singleUnitMode) {
    redirect("/inventory");
  }

  const setupBlock = resolveSetupBlock("transfers", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  if (setupBlock) {
    return <SetupEmptyState block={setupBlock} icon={ArrowLeftRight} />;
  }

  const sellerTab = params.tab ?? "my";
  const sellerView: "my" | "incoming" | "history" =
    sellerTab === "incoming" ? "incoming" : sellerTab === "history" ? "history" : "my";

  const loadTransfers = (): Promise<StockTransferWithRelations[]> => {
    if (isOwner) {
      const st = params.status;
      const statusFilter =
        st === "PENDING" || st === "CONFIRMED" || st === "CANCELLED" ? st : undefined;
      return listAllTransfersForAdmin(statusFilter);
    }
    if (sellerView === "my") {
      return listMyRequestedTransfers(session.user.id);
    }
    if (sellerView === "incoming") {
      return listPendingInboundForBranches(branchIds);
    }
    return listAllTransfersForBranches(branchIds);
  };

  const [allBranchesRaw, transfers, unseenCount] = await Promise.all([
    listActiveBranches(),
    loadTransfers(),
    getUnseenPendingTransfersCount(session.user.id, branchIds),
  ]);

  const allBranches = allBranchesRaw.map((b) => ({
    id: b.id,
    name: b.name,
    isWarehouse: b.isWarehouse,
  }));

  const branchesFrom = isOwner
    ? allBranches
    : allBranches.filter((b) => branchIds.includes(b.id));

  const serializedTransfers = transfers.map((t) => ({
    ...t,
    product: {
      ...t.product,
      salePrice: t.product.salePrice.toString(),
      costPrice: t.product.costPrice.toString(),
      minPrice: t.product.minPrice.toString(),
    },
  }));

  return (
      <TransfersPageContent
        transfers={serializedTransfers as any}
        originBranches={branchesFrom}
        destinationBranches={allBranches}
        userId={session.user.id}
        roleSlug={session.user.roleSlug ?? ""}
        userBranchIds={branchIds}
        currentTab={sellerView}
        currentStatus={params.status ?? ""}
        unseenCount={unseenCount}
      />
  );
}
