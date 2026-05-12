import Link from "next/link";

import { TransferRequestForm } from "@/components/transfers/transfer-request-form";
import { TransferRowActions } from "@/components/transfers/transfer-row-actions";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth-guards";
import { formatDate } from "@/lib/utils";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { listActiveBranches } from "@/modules/branches/service";
import {
  listAllTransfersForAdmin,
  listMyRequestedTransfers,
  listPendingInboundForBranches,
} from "@/modules/transfers/service";
import type { StockTransferWithRelations } from "@/modules/transfers/repository";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  if (status === "CONFIRMED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "neutral" as const;
}

function TransferCard({
  row,
  canConfirm,
  canCancel,
}: {
  row: StockTransferWithRelations;
  canConfirm: boolean;
  canCancel: boolean;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            <span className="text-sm text-[var(--muted-foreground)]">
              {formatDate(row.requestedAt)}
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">{row.product.name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {row.quantity} un. · {row.fromBranch.name} → {row.toBranch.name}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Solicitado por: {row.requestedBy.name ?? row.requestedBy.email ?? row.requestedById}
          </p>
          {row.notes ? (
            <p className="text-sm text-[var(--muted-foreground)]">Obs.: {row.notes}</p>
          ) : null}
        </div>
        <TransferRowActions
          transferId={row.id}
          status={row.status}
          canConfirm={canConfirm}
          canCancel={canCancel}
        />
      </div>
    </div>
  );
}

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const session = await requirePermission(permissionCatalog.transfersRead);
  const params = await searchParams;
  const isOwner = session.user.roleSlug === "owner";
  const branchIds = session.user.branchIds ?? [];
  const canWrite = hasPermission(session.user.permissions, permissionCatalog.transfersWrite);
  const canConfirm = hasPermission(
    session.user.permissions,
    permissionCatalog.transfersConfirm,
  );

  const allBranches = (await listActiveBranches()).map((b) => ({
    id: b.id,
    name: b.name,
    isWarehouse: b.isWarehouse,
  }));

  const sellerTab = params.tab ?? "my";
  const sellerView: "my" | "incoming" = sellerTab === "incoming" ? "incoming" : "my";

  let transfers: StockTransferWithRelations[] = [];
  if (isOwner) {
    const st = params.status;
    const statusFilter =
      st === "PENDING" || st === "CONFIRMED" || st === "CANCELLED" ? st : undefined;
    transfers = await listAllTransfersForAdmin(statusFilter);
  } else if (sellerView === "my") {
    transfers = await listMyRequestedTransfers(session.user.id);
  } else {
    transfers = await listPendingInboundForBranches(branchIds);
  }

  const branchesFrom = isOwner
    ? allBranches
    : allBranches.filter((b) => branchIds.includes(b.id));

  const branchesToPool = allBranches;

  return (
    <AppShell
      title="Transferências"
      subtitle="Solicite movimentação entre unidades e confirme o recebimento na filial de destino."
      pathname="/transfers"
    >
      {!isOwner ? (
        <div className="mb-6 flex gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--panel)] p-1">
          <Link
            href="/transfers?tab=my"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              sellerView === "my"
                ? "bg-[var(--accent)] text-[rgba(255,250,244,0.98)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Solicitadas por mim
          </Link>
          <Link
            href="/transfers?tab=incoming"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              sellerView === "incoming"
                ? "bg-[var(--accent)] text-[rgba(255,250,244,0.98)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Aguardando confirmação
          </Link>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["", "Todas"],
              ["PENDING", "Pendentes"],
              ["CONFIRMED", "Confirmadas"],
              ["CANCELLED", "Canceladas"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value || "all"}
              href={value ? `/transfers?status=${value}` : "/transfers"}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                (params.status ?? "") === value
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[rgba(255,250,244,0.98)]"
                  : "border-[var(--border-strong)] text-[var(--foreground)] hover:bg-[var(--panel-strong)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {canWrite ? (
        <Card className="mb-8 p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Nova solicitação</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            A confirmação na unidade de destino atualiza o estoque nas duas filiais.
          </p>
          <div className="mt-6">
            <TransferRequestForm branchesFrom={branchesFrom} branchesToPool={branchesToPool} />
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {transfers.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma transferência encontrada.</p>
        ) : (
          transfers.map((row) => {
            const isRequester = row.requestedById === session.user.id;
            const atDestination = branchIds.includes(row.toBranchId);
            const canConfirmRow =
              row.status === "PENDING" && canConfirm && (isOwner || atDestination);
            const canCancelRow =
              row.status === "PENDING" &&
              (isOwner || (canWrite && isRequester));

            return (
              <TransferCard
                key={row.id}
                row={row}
                canConfirm={canConfirmRow}
                canCancel={canCancelRow}
              />
            );
          })
        )}
      </div>
    </AppShell>
  );
}
