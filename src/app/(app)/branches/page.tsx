import { Building2 } from "lucide-react";

import { BranchesPageContent } from "@/components/branches/branches-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { requirePermission } from "@/lib/auth-guards";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { listBranchesAdmin } from "@/modules/branches/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const session = await requirePermission(permissionCatalog.branchesRead);
  const canWrite = hasPermission(session.user.permissions, permissionCatalog.branchesWrite);
  const [snapshot, branches] = await Promise.all([
    getSetupSnapshot(),
    listBranchesAdmin(),
  ]);
  const setupBlock = resolveSetupBlock("branches", snapshot);

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={Building2} />
  ) : (
      <BranchesPageContent
        canWrite={canWrite}
        branches={branches.map((b) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          isActive: b.isActive,
          isWarehouse: b.isWarehouse,
          zeroStockProductCount: b.zeroStockProductCount,
        }))}
      />
  );
}
