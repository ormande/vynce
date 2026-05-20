/**
 * Reconcilia estoque com vendas que não geraram movimentação SALE.
 *
 * Isso corrige vendas registradas quando "Permitir vendas sem estoque" não baixava
 * o saldo (comportamento antigo). Cada item de venda sem movimento correspondente
 * recebe um delta negativo na unidade da venda.
 *
 * Uso:
 *   npx tsx scripts/reconcile-stock-from-sales.ts           # simulação (padrão)
 *   npx tsx scripts/reconcile-stock-from-sales.ts --apply   # aplica no banco
 *
 * npm run db:reconcile-stock
 * npm run db:reconcile-stock -- --apply
 */

import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { applyBranchStockDelta } from "../src/lib/stock-ledger";

const db = new PrismaClient();

type PendingLine = {
  saleId: string;
  soldAt: Date;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  quantity: number;
};

async function saleItemHasMovement(
  saleId: string,
  branchId: string,
  productId: string,
  quantity: number,
) {
  const movement = await db.inventoryMovement.findFirst({
    where: {
      type: "SALE",
      branchId,
      productId,
      quantity: -quantity,
      note: { contains: saleId },
    },
    select: { id: true },
  });
  return Boolean(movement);
}

async function findPendingLines(): Promise<PendingLine[]> {
  const sales = await db.sale.findMany({
    include: {
      branch: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ soldAt: "asc" }, { createdAt: "asc" }],
  });

  const pending: PendingLine[] = [];

  for (const sale of sales) {
    for (const item of sale.items) {
      const hasMovement = await saleItemHasMovement(
        sale.id,
        sale.branchId,
        item.productId,
        item.quantity,
      );
      if (hasMovement) continue;

      pending.push({
        saleId: sale.id,
        soldAt: sale.soldAt,
        branchId: sale.branchId,
        branchName: sale.branch.name,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
      });
    }
  }

  return pending;
}

async function main() {
  const apply = process.argv.includes("--apply");

  console.log(
    apply
      ? "Modo APLICAR — alterações serão gravadas no banco.\n"
      : "Modo SIMULAÇÃO — nenhuma alteração será gravada. Use --apply para executar.\n",
  );

  const pending = await findPendingLines();

  if (pending.length === 0) {
    console.log("Nenhuma venda pendente de baixa de estoque. Estoque já está alinhado.");
    return;
  }

  const bySale = new Map<string, PendingLine[]>();
  for (const line of pending) {
    const group = bySale.get(line.saleId) ?? [];
    group.push(line);
    bySale.set(line.saleId, group);
  }

  console.log(
    `Encontradas ${pending.length} linha(s) em ${bySale.size} venda(s) sem movimentação SALE.\n`,
  );

  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const line of pending) {
    const label = `${line.soldAt.toISOString().slice(0, 10)} | ${line.branchName} | ${line.productName} | -${line.quantity} un. | venda ${line.saleId.slice(-8)}`;

    if (!apply) {
      console.log(`  [simular] ${label}`);
      applied++;
      continue;
    }

    try {
      await db.$transaction(async (tx) => {
        await applyBranchStockDelta(tx, {
          branchId: line.branchId,
          productId: line.productId,
          delta: -line.quantity,
          type: "SALE",
          note: `Venda ${line.saleId} (${line.branchName}) [reconciliação]`,
        });
      });
      console.log(`  [ok] ${label}`);
      applied++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  [erro] ${label}`);
      console.log(`         ${message}`);
      errors.push(`${label}: ${message}`);
      skipped++;
    }
  }

  console.log("\n--- Resumo ---");
  console.log(`Linhas processadas: ${applied}`);
  if (apply) {
    console.log(`Linhas com erro (estoque insuficiente?): ${skipped}`);
    if (errors.length > 0) {
      console.log("\nAjuste o estoque manualmente ou use Entrada de estoque antes de rodar de novo.");
    }
  } else {
    console.log(`Para aplicar: npx tsx scripts/reconcile-stock-from-sales.ts --apply`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
