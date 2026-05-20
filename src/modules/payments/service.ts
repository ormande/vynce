import { Prisma, ReceivableStatus, SalePaymentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  findReceivableById,
  listReceivables,
  listReceivablesForPayment,
  listReceivablesPaginated,
} from "@/modules/payments/repository";
import { paymentSchema, receivableUpdateSchema } from "@/modules/payments/schemas";

function mapReceivableFlags(
  receivables: Awaited<ReturnType<typeof listReceivables>>,
) {
  return receivables.map((receivable) => ({
    ...receivable,
    isOverdue:
      receivable.status !== ReceivableStatus.PAID &&
      new Date(receivable.dueDate) < new Date(),
    dueSoon:
      receivable.status !== ReceivableStatus.PAID &&
      new Date(receivable.dueDate).getTime() - Date.now() <=
        1000 * 60 * 60 * 24 * 3,
  }));
}

export async function getReceivables(search?: string) {
  const receivables = await listReceivables(search);
  return mapReceivableFlags(receivables);
}

export async function getReceivablesPaginated(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const result = await listReceivablesPaginated(params);
  return {
    ...result,
    items: mapReceivableFlags(result.items),
  };
}

export async function getReceivablesForPayment(search?: string) {
  const receivables = await listReceivablesForPayment(search);
  return mapReceivableFlags(receivables);
}

export async function registerPayment(input: unknown, createdById?: string) {
  const data = paymentSchema.parse(input);

  return db.$transaction(async (tx) => {
    const receivable = await tx.receivable.findUnique({
      where: { id: data.receivableId },
      include: { sale: true },
    });

    if (!receivable) {
      throw new AppError("Recebível não encontrado.", 404);
    }

    if (
      receivable.status === ReceivableStatus.PAID ||
      Number(receivable.balanceDue) <= 0
    ) {
      throw new AppError("Este recebível já está quitado.", 400);
    }

    const nextPaid = Number(receivable.paidAmount) + data.amount;
    const nextBalance = Number(receivable.originalAmount) - nextPaid;
    const status =
      nextBalance <= 0
        ? ReceivableStatus.PAID
        : nextPaid > 0
          ? ReceivableStatus.PARTIAL
          : ReceivableStatus.OPEN;

    const payment = await tx.payment.create({
      data: {
        receivableId: receivable.id,
        customerId: data.customerId || receivable.customerId,
        saleId: data.saleId || receivable.saleId || undefined,
        createdById,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        receivedAt: new Date(data.receivedAt),
        note: data.note || undefined,
      },
    });

    await tx.receivable.update({
      where: { id: receivable.id },
      data: {
        paidAmount: new Prisma.Decimal(nextPaid),
        balanceDue: new Prisma.Decimal(Math.max(nextBalance, 0)),
        status,
        lastPaymentAt: new Date(data.receivedAt),
      },
    });

    if (receivable.saleId) {
      await tx.sale.update({
        where: { id: receivable.saleId },
        data: {
          paymentStatus:
            nextBalance <= 0
              ? SalePaymentStatus.PAID
              : SalePaymentStatus.PARTIAL,
        },
      });
    }

    return payment;
  });
}

export async function updateReceivable(id: string, input: unknown) {
  const data = receivableUpdateSchema.parse(input);
  const receivable = await findReceivableById(id);

  if (!receivable) {
    throw new AppError("Recebível não encontrado.", 404);
  }

  if (receivable.status === ReceivableStatus.PAID) {
    throw new AppError("Não é possível editar um título já quitado.", 400);
  }

  const dueDate = new Date(`${data.dueDate}T12:00:00`);
  if (Number.isNaN(dueDate.getTime())) {
    throw new AppError("Data de vencimento inválida.", 400);
  }

  const now = new Date();
  const status =
    Number(receivable.paidAmount) > 0
      ? ReceivableStatus.PARTIAL
      : dueDate < now
        ? ReceivableStatus.OVERDUE
        : ReceivableStatus.OPEN;

  const updated = await db.receivable.update({
    where: { id },
    data: {
      dueDate,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      status,
    },
    include: { customer: true, sale: true, payments: true },
  });

  if (receivable.saleId) {
    await db.sale.update({
      where: { id: receivable.saleId },
      data: { dueDate },
    });
  }

  return updated;
}

export async function deleteReceivable(id: string) {
  const receivable = await findReceivableById(id);

  if (!receivable) {
    throw new AppError("Recebível não encontrado.", 404);
  }

  if (Number(receivable.paidAmount) > 0) {
    throw new AppError(
      "Este título possui pagamentos registrados. Estorne antes de excluir.",
      409,
    );
  }

  if (receivable.saleId) {
    const { deleteSale } = await import("@/modules/sales/service");
    await deleteSale(receivable.saleId);
    return;
  }

  await db.receivable.delete({ where: { id } });
}
