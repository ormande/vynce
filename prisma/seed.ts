import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissionKeys = [
  ["dashboard:view", "Visualizar dashboard"],
  ["customers:read", "Visualizar clientes"],
  ["customers:write", "Gerenciar clientes"],
  ["products:read", "Visualizar produtos"],
  ["products:write", "Gerenciar produtos"],
  ["inventory:read", "Visualizar estoque"],
  ["inventory:write", "Gerenciar estoque"],
  ["sales:read", "Visualizar vendas"],
  ["sales:write", "Registrar vendas"],
  ["receivables:read", "Visualizar contas a receber"],
  ["receivables:write", "Registrar pagamentos"],
  ["reports:read", "Visualizar relatórios"],
  ["users:manage", "Gerenciar usuários"],
  ["settings:manage", "Gerenciar configurações"],
  ["branches:read", "Visualizar unidades"],
  ["branches:write", "Gerenciar unidades"],
  ["branches:transfer", "Transferir estoque entre unidades"],
  ["transfers:read", "Visualizar transferências"],
  ["transfers:write", "Solicitar transferências"],
  ["transfers:confirm", "Confirmar recebimento de transferências"],
] as const;

const sellerPermissionKeys = new Set<string>([
  "customers:read",
  "products:read",
  "inventory:read",
  "sales:read",
  "sales:write",
  "transfers:read",
  "transfers:write",
  "transfers:confirm",
]);

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", allowSalesWithoutStock: false, singleUnitMode: false },
  });

  for (const [key, name] of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: { name },
      create: { key, name },
    });
  }

  const permissions = await prisma.permission.findMany();

  const ownerRole = await prisma.role.upsert({
    where: { slug: "owner" },
    update: {
      name: "Proprietário / Admin",
      description: "Acesso completo ao sistema",
    },
    create: {
      slug: "owner",
      name: "Proprietário / Admin",
      description: "Acesso completo ao sistema",
    },
  });

  const sellerRole = await prisma.role.upsert({
    where: { slug: "seller" },
    update: {
      name: "Vendedor",
      description: "Acesso operacional à venda, estoque da unidade e transferências",
    },
    create: {
      slug: "seller",
      name: "Vendedor",
      description: "Acesso operacional à venda, estoque da unidade e transferências",
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: [ownerRole.id, sellerRole.id] } },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: ownerRole.id,
      permissionId: permission.id,
    })),
  });

  const sellerPermissions = permissions.filter((permission) =>
    sellerPermissionKeys.has(permission.key),
  );

  await prisma.rolePermission.createMany({
    data: sellerPermissions.map((permission) => ({
      roleId: sellerRole.id,
      permissionId: permission.id,
    })),
  });

  // Cliente interno para vendas avulsas (quando o módulo de clientes está oculto
  // ou quando o vendedor não associa um cliente à venda). Sem isso, o fallback
  // do service ainda cria sob demanda, mas mantemos aqui por garantia.
  await prisma.customer.upsert({
    where: { phone: "00000000000" },
    update: {},
    create: {
      name: "Venda avulsa",
      phone: "00000000000",
      notes: "Cliente interno usado quando o módulo de clientes está oculto na interface.",
    },
  });

  console.log("Seed mínimo concluído: permissões, roles e walk-in customer.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
