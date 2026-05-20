-- AlterTable: torna o telefone opcional (o índice único permite múltiplos NULLs)
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;
