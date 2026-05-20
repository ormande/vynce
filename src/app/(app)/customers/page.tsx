import { redirect } from "next/navigation";

import { Users } from "lucide-react";

import { CustomersPageContent } from "@/components/customers/customers-page-content";
import { AppShell } from "@/components/layout/app-shell";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/auth-guards";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { getCustomers } from "@/modules/customers/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
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
  const [snapshot, settings, customers] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getCustomers(params?.q),
  ]);

  const setupBlock = resolveSetupBlock("customers", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return (
    <AppShell
      title="Clientes"
      subtitle="Cadastro de clientes com histórico de compras e saldo devedor calculado automaticamente."
      pathname="/customers"
    >
      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={Users} />
      ) : (
      <CustomersPageContent
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          cpf: customer.cpf,
          address: customer.address,
          notes: customer.notes,
          purchaseHistoryCount: customer.purchaseHistoryCount,
          outstandingBalance: customer.outstandingBalance,
        }))}
        canWrite={canWrite}
      />
      )}
    </AppShell>
  );
}
