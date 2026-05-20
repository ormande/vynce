import { ReceivableStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function listReceivables(search?: string) {
  return db.receivable.findMany({
    where: search
      ? {
          customer: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }
      : undefined,
    include: {
      customer: true,
      sale: true,
      payments: true,
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

/** Recebíveis com saldo em aberto (para baixa em Contas a receber). */
export async function listReceivablesForPayment(search?: string) {
  return db.receivable.findMany({
    where: {
      status: {
        in: [
          ReceivableStatus.OPEN,
          ReceivableStatus.PARTIAL,
          ReceivableStatus.OVERDUE,
        ],
      },
      balanceDue: { gt: 0 },
      ...(search
        ? {
            customer: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
    },
    include: {
      customer: true,
      sale: true,
      payments: true,
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}
