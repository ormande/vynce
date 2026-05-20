import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { ReceivablesPageContent } from "@/components/receivables/receivables-page-content";
import { AppShell } from "@/components/layout/app-shell";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { requirePermission } from "@/lib/auth-guards";
import { SHOW_RECEIVABLES_MODULE_UI } from "@/lib/platform-config";
import { permissionCatalog } from "@/lib/permissions";
import {
  getReceivables,
  getReceivablesForPayment,
} from "@/modules/payments/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function ReceivablesPage() {
  if (!SHOW_RECEIVABLES_MODULE_UI) {
    redirect("/dashboard");
  }

  await requirePermission(permissionCatalog.receivablesRead);

  const [snapshot, settings, receivables, receivablesForPayment] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    getReceivables(),
    getReceivablesForPayment(),
  ]);

  const setupBlock = resolveSetupBlock("receivables", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  const mapRow = (receivable: (typeof receivables)[number]) => ({
    id: receivable.id,
    customer: receivable.customer,
    balanceDue: receivable.balanceDue.toString(),
    customerId: receivable.customerId,
    saleId: receivable.saleId,
    dueDate: receivable.dueDate,
    status: receivable.status,
    isOverdue: receivable.isOverdue,
    dueSoon: receivable.dueSoon,
  });

  return (
    <AppShell
      title="Contas a receber"
      subtitle="Acompanhamento de vencimentos, pendências e registro de pagamentos recebidos."
      pathname="/receivables"
    >
      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={CreditCard} />
      ) : (
        <ReceivablesPageContent
          receivables={receivables.map(mapRow)}
          receivablesForPayment={receivablesForPayment.map(mapRow)}
        />
      )}
    </AppShell>
  );
}
