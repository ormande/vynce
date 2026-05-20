import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { ReceivablesPageContent } from "@/components/receivables/receivables-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { parsePageParam } from "@/lib/pagination";
import { requirePermission } from "@/lib/auth-guards";
import { SHOW_RECEIVABLES_MODULE_UI } from "@/lib/platform-config";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import {
  getReceivablesForPayment,
  getReceivablesPaginated,
} from "@/modules/payments/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

const EMPTY_RECEIVABLES_PAGE = {
  items: [],
  page: 1,
  totalPages: 1,
  pageSize: 10,
  total: 0,
};

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  if (!SHOW_RECEIVABLES_MODULE_UI) {
    redirect("/dashboard");
  }

  const session = await requirePermission(permissionCatalog.receivablesRead);
  const canWrite = hasPermission(
    session.user.permissions,
    permissionCatalog.receivablesWrite,
  );

  const params = await searchParams;
  const tab = params.tab === "records" ? "records" : "register";
  const page = parsePageParam(params.page);

  let snapshot: Awaited<ReturnType<typeof getSetupSnapshot>>;
  let settings: Awaited<ReturnType<typeof getPlatformSettings>>;
  let receivablesResult: Awaited<ReturnType<typeof getReceivablesPaginated>> =
    EMPTY_RECEIVABLES_PAGE;
  let receivablesForPayment: Awaited<ReturnType<typeof getReceivablesForPayment>> =
    [];

  if (tab === "register") {
    [snapshot, settings, receivablesForPayment] = await Promise.all([
      getSetupSnapshot(),
      getPlatformSettings(),
      getReceivablesForPayment(),
    ]);
  } else {
    [snapshot, settings, receivablesResult] = await Promise.all([
      getSetupSnapshot(),
      getPlatformSettings(),
      getReceivablesPaginated({ page, pageSize: 10 }),
    ]);
  }

  const setupBlock = resolveSetupBlock("receivables", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  const mapRow = (receivable: (typeof receivablesResult.items)[number]) => ({
    id: receivable.id,
    customer: receivable.customer,
    balanceDue: receivable.balanceDue.toString(),
    customerId: receivable.customerId,
    saleId: receivable.saleId,
    dueDate: receivable.dueDate,
    status: receivable.status,
    isOverdue: receivable.isOverdue,
    dueSoon: receivable.dueSoon,
    notes: receivable.notes,
  });

  return setupBlock ? (
    <SetupEmptyState block={setupBlock} icon={CreditCard} />
  ) : (
        <ReceivablesPageContent
          tab={tab}
          page={receivablesResult.page}
          totalPages={receivablesResult.totalPages}
          receivables={receivablesResult.items.map(mapRow)}
          receivablesForPayment={receivablesForPayment.map(mapRow)}
          canWrite={canWrite}
        />
  );
}
