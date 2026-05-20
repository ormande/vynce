import { Prisma, ReceivableStatus, SalePaymentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  findReceivableById,
  listReceivables,
  listReceivablesForPayment,
  listReceivablesPaginated,
} from "@/modules/payments/repository";
import {
  paymentSchema,
  receivableUpdateSchema,
  type PaymentInput,
} from "@/modules/payments/schemas";

const OPEN_STATUSES: ReceivableStatus[] = [
  ReceivableStatus.OPEN,
  ReceivableStatus.PARTIAL,
  ReceivableStatus.OVERDUE,
];

type ReceivableWithSale = Prisma.ReceivableGetPayload<{
  include: { sale: true };
}>;

async function applyPaymentToReceivable(
  tx: Prisma.TransactionClient,
  receivable: ReceivableWithSale,
  amount: number,
  data: PaymentInput,
  createdById?: string,
) {
  if (
    receivable.status === ReceivableStatus.PAID ||
    Number(receivable.balanceDue) <= 0
  ) {
    throw new AppError("Este recebível já está quitado.", 400);
  }

  const balance = Number(receivable.balanceDue);
  if (amount > balance + 0.001) {
    throw new AppError(
      `O valor excede o saldo do título (${balance.toFixed(2)}).`,
      400,
    );
  }

  const nextPaid = Number(receivable.paidAmount) + amount;
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
      amount: new Prisma.Decimal(amount),
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
}

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

async function registerCustomerPayment(
  data: PaymentInput,
  createdById?: string,
) {
  const customerId = data.customerId!;

  return db.$transaction(async (tx) => {
    const receivables = await tx.receivable.findMany({
      where: {
        customerId,
        status: { in: OPEN_STATUSES },
        balanceDue: { gt: 0 },
      },
      include: { sale: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    if (receivables.length === 0) {
      throw new AppError("Nenhum título em aberto para este cliente.", 404);
    }

    const totalBalance = receivables.reduce(
      (sum, item) => sum + Number(item.balanceDue),
      0,
    );

    if (data.amount > totalBalance + 0.001) {
      throw new AppError(
        `O valor informado excede o saldo total do cliente (R$ ${totalBalance.toFixed(2).replace(".", ",")}).`,
        400,
      );
    }

    let remaining = data.amount;
    const payments = [];

    for (const receivable of receivables) {
      if (remaining <= 0) break;
      const balance = Number(receivable.balanceDue);
      const slice = Math.min(remaining, balance);
      const payment = await applyPaymentToReceivable(
        tx,
        receivable,
        slice,
        { ...data, customerId },
        createdById,
      );
      payments.push(payment);
      remaining -= slice;
    }

    return payments;
  });
}

export async function registerPayment(input: unknown, createdById?: string) {
  const data = paymentSchema.parse(input);

  if (data.customerId && !data.receivableId) {
    const payments = await registerCustomerPayment(data, createdById);
    return payments[0];
  }

  if (!data.receivableId) {
    throw new AppError("Selecione o cliente com título em aberto.", 400);
  }

  return db.$transaction(async (tx) => {
    const receivable = await tx.receivable.findUnique({
      where: { id: data.receivableId },
      include: { sale: true },
    });

    if (!receivable) {
      throw new AppError("Recebível não encontrado.", 404);
    }

    return applyPaymentToReceivable(tx, receivable, data.amount, data, createdById);
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
