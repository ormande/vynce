-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allowSalesWithoutStock" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSettings" ("id", "allowSalesWithoutStock", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);

-- Sincroniza estoque total dos produtos com a soma por unidade
UPDATE "Product" p
SET "stockQuantity" = COALESCE(
  (
    SELECT SUM(bs."quantity")
    FROM "BranchStock" bs
    WHERE bs."productId" = p."id"
  ),
  0
);
