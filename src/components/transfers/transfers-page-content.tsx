"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { NewTransferModal } from "./new-transfer-modal";
import { TransferRowActions } from "./transfer-row-actions";
import { markTransfersAsViewedAction } from "@/modules/transfers/actions";
import type { StockTransferWithRelations } from "@/modules/transfers/repository";

function statusTone(status: string) {
  if (status === "CONFIRMED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "neutral" as const;
}

export function TransfersPageContent({
  transfers,
  originBranches,
  destinationBranches,
  userId,
  roleSlug,
  userBranchIds,
  currentTab,
  currentStatus,
  unseenCount = 0,
}: {
  transfers: StockTransferWithRelations[];
  originBranches: any[];
  destinationBranches: any[];
  userId: string;
  roleSlug: string;
  userBranchIds: string[];
  currentTab: string;
  currentStatus: string;
  unseenCount?: number;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentTab === "incoming" && unseenCount > 0) {
      void markTransfersAsViewedAction().then(() => {
        router.refresh();
      });
    }
  }, [currentTab, unseenCount, router]);

  const isOwner = roleSlug === "owner";
  const canWrite = roleSlug === "owner" || roleSlug === "seller"; // Seller can write as long as it has branches
  const canConfirm = roleSlug === "owner" || roleSlug === "seller"; // Permissions should ideally be passed, but let's assume standard role behavior.

  const showActions = currentTab !== "history";

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          {!isOwner ? (
            <>
              <Link
                href="/transfers?tab=my"
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
                  currentTab === "my"
                    ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                    : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                )}
              >
                Solicitadas por mim
              </Link>
              <Link
                href="/transfers?tab=incoming"
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
                  currentTab === "incoming"
                    ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                    : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                )}
              >
                <span>Aguardando confirmação</span>
                {unseenCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {unseenCount}
                  </span>
                )}
              </Link>
              <Link
                href="/transfers?tab=history"
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
                  currentTab === "history"
                    ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                    : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                )}
              >
                Histórico
              </Link>
            </>
          ) : (
            <>
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
                  className={cn(
                    "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
                    currentStatus === value
                      ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                      : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                  )}
                >
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>

        {canWrite && (
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Nova Transferência
          </ActionButton>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-1 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm text-[var(--muted-foreground)] border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="px-5 py-4 font-semibold text-[var(--foreground)] text-left">Produto</th>
                <th className="px-5 py-4 font-semibold text-[var(--foreground)]">Quantidade</th>
                <th className="px-5 py-4 font-semibold text-[var(--foreground)]">Origem → Destino</th>
                <th className="px-5 py-4 font-semibold text-[var(--foreground)]">Data</th>
                <th className="px-5 py-4 font-semibold text-[var(--foreground)]">Status</th>
                {showActions && (
                  <th className="px-5 py-4 font-semibold text-[var(--foreground)] text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-[var(--panel)]">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-4">
                        <ArrowLeftRight className="h-8 w-8 opacity-40" />
                      </div>
                      <p>Nenhuma transferência encontrada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((row) => {
                  const isRequester = row.requestedById === userId;
                  const atDestination = userBranchIds.includes(row.toBranchId);
                  const canConfirmRow =
                    row.status === "PENDING" && canConfirm && (isOwner || atDestination);
                  const canCancelRow =
                    row.status === "PENDING" &&
                    (isOwner || (canWrite && isRequester));

                  return (
                    <tr
                      key={row.id}
                      className="rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md"
                    >
                      <td className="rounded-l-3xl px-5 py-4 text-left">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--foreground)]">{row.product.name}</span>
                          <span className="text-xs">Solicitante: {row.requestedBy.name ?? row.requestedBy.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--foreground)]">
                        {row.quantity} un.
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium text-[var(--foreground)]">{row.fromBranch.name}</span>
                          <span className="text-[var(--muted-foreground)]">→</span>
                          <span className="font-medium text-[var(--foreground)]">{row.toBranch.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {format(new Date(row.requestedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className={cn("px-5 py-4", !showActions && "rounded-r-3xl")}>
                        <Badge tone={statusTone(row.status)}>
                          {row.status === "PENDING" ? "Pendente" : row.status === "CONFIRMED" ? "Confirmada" : "Cancelada"}
                        </Badge>
                      </td>
                      {showActions && (
                        <td className="rounded-r-3xl px-5 py-4 text-right">
                          <TransferRowActions
                            transferId={row.id}
                            status={row.status}
                            canConfirm={canConfirmRow}
                            canCancel={canCancelRow}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewTransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        branchesFrom={originBranches}
        branchesToPool={destinationBranches}
      />
    </>
  );
}
