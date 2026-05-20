import { redirect } from "next/navigation";

import { Users } from "lucide-react";

import { CustomersPageContent } from "@/components/customers/customers-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/auth-guards";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { paginateArray, parsePageParam } from "@/lib/pagination";
import { getCustomers } from "@/modules/customers/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  if (!SHOW_CUSTOMERS_MODULE_UI) {
    redirect("/dashboard");
  }

  await requirePermission(permissionCatalog.customersRead);

  const session = await auth();
  const canWrite = hasPermission(
    session?.user.permissions,
    permissionCatalog.customersWrite,
  );

  const params = await searchParams;
  const page = parsePageParam(params?.page);
  const [snapshot, settings, customers] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getCustomers(params?.q),
  ]);

  const customerRows = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    cpf: customer.cpf,
    address: customer.address,
    notes: customer.notes,
    purchaseHistoryCount: customer.purchaseHistoryCount,
    outstandingBalance: customer.outstandingBalance,
  }));

  const paginated = paginateArray(customerRows, page);

  const setupBlock = resolveSetupBlock("customers", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={Users} />
  ) : (
      <CustomersPageContent
        customers={paginated.items}
        page={paginated.page}
        totalPages={paginated.totalPages}
        totalCount={paginated.total}
        searchQuery={params?.q ?? ""}
        canWrite={canWrite}
      />
  );
}
