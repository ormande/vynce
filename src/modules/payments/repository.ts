import { ReceivableStatus, type Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const receivableInclude = {
  customer: true,
  sale: true,
  payments: true,
} as const;

function buildReceivableWhere(search?: string): Prisma.ReceivableWhereInput | undefined {
  if (!search) return undefined;
  return {
    customer: {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
  };
}

export async function listReceivables(search?: string) {
  const where = buildReceivableWhere(search);
  return db.receivable.findMany({
    where,
    include: receivableInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function listReceivablesPaginated(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const where = buildReceivableWhere(params.search);

  const [items, total] = await Promise.all([
    db.receivable.findMany({
      where,
      include: receivableInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.receivable.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function findReceivableById(id: string) {
  return db.receivable.findUnique({
    where: { id },
    include: receivableInclude,
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
