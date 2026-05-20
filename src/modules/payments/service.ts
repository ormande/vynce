import { Prisma, ReceivableStatus, SalePaymentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  listReceivables,
  listReceivablesForPayment,
} from "@/modules/payments/repository";
import { paymentSchema } from "@/modules/payments/schemas";

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
