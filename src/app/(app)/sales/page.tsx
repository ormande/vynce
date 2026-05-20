import { Receipt } from "lucide-react";

import { SalesPageContent } from "@/components/sales/sales-page-content";
import type { SaleRecordRow } from "@/components/sales/sale-edit-modal";
import { AppShell } from "@/components/layout/app-shell";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { parsePageParam } from "@/lib/pagination";
import { requirePermission } from "@/lib/auth-guards";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { listActiveBranches } from "@/modules/branches/service";
import { getCustomersForSaleForm } from "@/modules/customers/service";
import { getProducts } from "@/modules/products/service";
import { getSalesPaginated } from "@/modules/sales/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const session = await requirePermission(permissionCatalog.salesRead);
  const isSeller = session.user.roleSlug === "seller";
  const branchIds = session.user.branchIds ?? [];
  const canWrite = hasPermission(session.user.permissions, permissionCatalog.salesWrite);

  const params = await searchParams;
  const tab = params.tab === "records" ? "records" : "register";
  const page = parsePageParam(params.page);

  const [snapshot, settings, allBranches, customerFormData, products] =
    await Promise.all([
      getSetupSnapshot(),
      getPlatformSettings(),
      listActiveBranches(),
      getCustomersForSaleForm(),
      getProducts({ status: "ALL" }),
    ]);

  const setupBlock = resolveSetupBlock("sales", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  const branches = isSeller
    ? allBranches.filter((b) => branchIds.includes(b.id))
    : allBranches;

  const salesResult = await getSalesPaginated({
    branchIds: isSeller && branchIds.length > 0 ? branchIds : undefined,
    page: tab === "records" ? page : 1,
    pageSize: 10,
  });

  const defaultBranchId =
    branches.find((b) => !b.isWarehouse)?.id ?? branches[0]?.id ?? "";

  const salesRows: SaleRecordRow[] = salesResult.items.map((sale) => ({
    id: sale.id,
    branch: { name: sale.branch.name },
    customer: { id: sale.customer.id, name: sale.customer.name },
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    soldAt: sale.soldAt.toISOString(),
    dueDate: sale.dueDate?.toISOString() ?? null,
    notes: sale.notes,
    total: sale.total.toString(),
    items: sale.items.map((item) => ({
      quantity: item.quantity,
      product: { name: item.product.name },
      total: item.total,
    })),
  }));

  return (
    <AppShell
      title="Vendas"
      subtitle="Registro de vendas à vista ou fiado, com atualização automática de estoque e títulos a receber."
      pathname="/sales"
    >
      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={Receipt} />
      ) : (
        <SalesPageContent
          tab={tab}
          page={salesResult.page}
          totalPages={salesResult.totalPages}
          sales={salesRows}
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            isWarehouse: b.isWarehouse,
          }))}
          defaultBranchId={defaultBranchId}
          walkInCustomerId={customerFormData.walkInCustomerId}
          customers={customerFormData.customers}
          showCustomerPicker={SHOW_CUSTOMERS_MODULE_UI}
          products={products.items.map((product) => ({
            id: product.id,
            name: product.name,
            salePrice: product.salePrice.toString(),
          }))}
          canWrite={canWrite}
        />
      )}
    </AppShell>
  );
}
