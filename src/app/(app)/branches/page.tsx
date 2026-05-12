import { AppShell } from "@/components/layout/app-shell";
import { BranchesPageContent } from "@/components/branches/branches-page-content";
import { requirePermission } from "@/lib/auth-guards";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { listBranchesAdmin } from "@/modules/branches/service";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const session = await requirePermission(permissionCatalog.branchesRead);
  const canWrite = hasPermission(session.user.permissions, permissionCatalog.branchesWrite);
  const branches = await listBranchesAdmin();

  return (
    <AppShell
      title="Unidades"
      subtitle="Filiais, lojas e depósito central. Estoque e vendas são vinculados à unidade selecionada."
      pathname="/branches"
    >
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
    </AppShell>
  );
}
