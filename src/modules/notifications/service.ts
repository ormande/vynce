import { ReceivableStatus } from "@prisma/client";

import { db } from "@/lib/db";
import {
  SHOW_RECEIVABLES_MODULE_UI,
} from "@/lib/platform-config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { findPendingTransfersToBranches } from "@/modules/transfers/repository";

export type AppNotification = {
  id: string;
  category: string;
  title: string;
  snippet: string;
  href: string;
  createdAt: string;
};

export async function getNotificationsForUser(params: {
  userId: string;
  roleSlug?: string | null;
  branchIds: string[];
  accessAll: boolean;
  singleUnitMode?: boolean;
}): Promise<AppNotification[]> {
  const { userId, roleSlug, branchIds, accessAll, singleUnitMode = false } = params;
  const items: AppNotification[] = [];
  const isOwner = roleSlug === "owner" || accessAll;

  if (!singleUnitMode) {
  const pendingTransfers = isOwner
    ? await db.stockTransfer.findMany({
        where: { status: "PENDING" },
        include: {
          product: true,
          fromBranch: true,
          toBranch: true,
        },
        orderBy: { requestedAt: "desc" },
        take: 20,
      })
    : await findPendingTransfersToBranches(branchIds);

  for (const transfer of pendingTransfers) {
    items.push({
      id: `transfer:${transfer.id}`,
      category: "Transferências",
      title: `${transfer.product.name} · ${transfer.quantity} un.`,
      snippet: `${transfer.fromBranch.name} → ${transfer.toBranch.name} aguardando confirmação`,
      href: isOwner ? "/transfers?status=PENDING" : "/transfers?tab=incoming",
      createdAt: transfer.requestedAt.toISOString(),
    });
  }
  }

  const lowStockProducts = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      lowStockThreshold: true,
      updatedAt: true,
    },
    orderBy: { stockQuantity: "asc" },
    take: 30,
  });

  for (const product of lowStockProducts) {
    if (product.stockQuantity > product.lowStockThreshold) continue;

    items.push({
      id: `lowstock:${product.id}`,
      category: "Estoque",
      title: product.name,
      snippet: `Estoque baixo: ${product.stockQuantity} un. (mínimo ${product.lowStockThreshold})`,
      href: "/inventory",
      createdAt: product.updatedAt.toISOString(),
    });
  }

  if (SHOW_RECEIVABLES_MODULE_UI && isOwner) {
    const overdue = await db.receivable.findMany({
      where: {
        status: {
          in: [
            ReceivableStatus.OPEN,
            ReceivableStatus.PARTIAL,
            ReceivableStatus.OVERDUE,
          ],
        },
        dueDate: { lt: new Date() },
      },
      include: { customer: true },
      orderBy: { dueDate: "asc" },
      take: 15,
    });

    for (const receivable of overdue) {
      items.push({
        id: `receivable:${receivable.id}`,
        category: "Recebíveis",
        title: receivable.customer.name,
        snippet: `Vencido em ${formatDate(receivable.dueDate)} · saldo ${formatCurrency(receivable.balanceDue.toString())}`,
        href: "/receivables",
        createdAt: receivable.dueDate.toISOString(),
      });
    }
  }

  if (!singleUnitMode) {
    const myPendingOutbound = await db.stockTransfer.findMany({
      where: {
        status: "PENDING",
        requestedById: userId,
      },
      include: {
        product: true,
        fromBranch: true,
        toBranch: true,
      },
      orderBy: { requestedAt: "desc" },
      take: 10,
    });

    for (const transfer of myPendingOutbound) {
      const id = `transfer-out:${transfer.id}`;
      if (items.some((n) => n.id === `transfer:${transfer.id}`)) continue;

      items.push({
        id,
        category: "Transferências",
        title: `Solicitação: ${transfer.product.name}`,
        snippet: `Enviado de ${transfer.fromBranch.name} para ${transfer.toBranch.name} · aguardando confirmação`,
        href: "/transfers?tab=my",
        createdAt: transfer.requestedAt.toISOString(),
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getNotificationCount(params: {
  userId: string;
  roleSlug?: string | null;
  branchIds: string[];
  accessAll: boolean;
  singleUnitMode?: boolean;
}): Promise<number> {
  const notifications = await getNotificationsForUser(params);
  return notifications.length;
}
