import { PrismaClient, PaymentMethod, ProductStatus } from "@prisma/client";

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
] as const;

async function main() {
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
      name: "Owner/Admin",
      description: "Acesso completo ao sistema",
    },
    create: {
      slug: "owner",
      name: "Owner/Admin",
      description: "Acesso completo ao sistema",
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { slug: "employee" },
    update: {
      name: "Funcionário",
      description: "Acesso operacional com permissões restritas",
    },
    create: {
      slug: "employee",
      name: "Funcionário",
      description: "Acesso operacional com permissões restritas",
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: [ownerRole.id, employeeRole.id] } },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: ownerRole.id,
      permissionId: permission.id,
    })),
  });

  const employeePermissions = permissions.filter((permission) =>
    [
      "dashboard:view",
      "customers:read",
      "customers:write",
      "products:read",
      "inventory:read",
      "sales:read",
      "sales:write",
      "receivables:read",
      "receivables:write",
      "reports:read",
    ].includes(permission.key),
  );

  await prisma.rolePermission.createMany({
    data: employeePermissions.map((permission) => ({
      roleId: employeeRole.id,
      permissionId: permission.id,
    })),
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Bebidas" },
      update: {},
      create: { name: "Bebidas", description: "Refrigerantes, sucos e água" },
    }),
    prisma.category.upsert({
      where: { name: "Mercearia" },
      update: {},
      create: { name: "Mercearia", description: "Itens de consumo diário" },
    }),
    prisma.category.upsert({
      where: { name: "Limpeza" },
      update: {},
      create: { name: "Limpeza", description: "Produtos de limpeza e higiene" },
    }),
  ]);

  const productPayload = [
    {
      name: "Café Torrado Premium 500g",
      categoryId: categories[1].id,
      code: "CAF-500",
      costPrice: 13.5,
      salePrice: 21.9,
      stockQuantity: 24,
      lowStockThreshold: 8,
      status: ProductStatus.ACTIVE,
    },
    {
      name: "Detergente Neutro 500ml",
      categoryId: categories[2].id,
      code: "DET-500",
      costPrice: 2.85,
      salePrice: 4.99,
      stockQuantity: 7,
      lowStockThreshold: 10,
      status: ProductStatus.ACTIVE,
    },
    {
      name: "Água Mineral 1,5L",
      categoryId: categories[0].id,
      code: "AGU-1500",
      costPrice: 2.2,
      salePrice: 3.9,
      stockQuantity: 32,
      lowStockThreshold: 12,
      status: ProductStatus.ACTIVE,
    },
  ];

  for (const product of productPayload) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }

  const customer1 = await prisma.customer.upsert({
    where: { phone: "65999990001" },
    update: {},
    create: {
      name: "Marina Oliveira",
      phone: "65999990001",
      address: "Rua das Flores, 123",
      notes: "Cliente frequente, prefere contato por WhatsApp.",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { phone: "65999990002" },
    update: {},
    create: {
      name: "Carlos Mendonça",
      phone: "65999990002",
      cpf: "12345678909",
      address: "Av. Brasil, 882",
    },
  });

  const [coffee, detergent, water] = await prisma.product.findMany({
    where: {
      code: { in: ["CAF-500", "DET-500", "AGU-1500"] },
    },
    orderBy: { name: "asc" },
  });

  const sale = await prisma.sale.upsert({
    where: { id: "seed-sale-marina" },
    update: {},
    create: {
      id: "seed-sale-marina",
      customerId: customer1.id,
      paymentMethod: PaymentMethod.CREDIT,
      paymentStatus: "PARTIAL",
      subtotal: 29.7,
      discount: 0,
      total: 29.7,
      soldAt: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      items: {
        create: [
          {
            productId: coffee.id,
            quantity: 1,
            unitPrice: 21.9,
            costSnapshot: 13.5,
            total: 21.9,
          },
          {
            productId: water.id,
            quantity: 2,
            unitPrice: 3.9,
            costSnapshot: 2.2,
            total: 7.8,
          },
        ],
      },
      receivable: {
        create: {
          customerId: customer1.id,
          originalAmount: 29.7,
          paidAmount: 10,
          balanceDue: 19.7,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          status: "PARTIAL",
          lastPaymentAt: new Date(),
        },
      },
      payments: {
        create: {
          customerId: customer1.id,
          amount: 10,
          method: PaymentMethod.PIX,
          receivedAt: new Date(),
        },
      },
    },
  });

  await prisma.sale.upsert({
    where: { id: "seed-sale-carlos" },
    update: {},
    create: {
      id: "seed-sale-carlos",
      customerId: customer2.id,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: "PAID",
      subtotal: 19.96,
      discount: 0,
      total: 19.96,
      soldAt: new Date(),
      items: {
        create: [
          {
            productId: detergent.id,
            quantity: 4,
            unitPrice: 4.99,
            costSnapshot: 2.85,
            total: 19.96,
          },
        ],
      },
      payments: {
        create: {
          customerId: customer2.id,
          amount: 19.96,
          method: PaymentMethod.CASH,
          receivedAt: new Date(),
        },
      },
    },
  });

  const receivable = await prisma.receivable.findFirst({
    where: { saleId: sale.id },
  });

  if (receivable) {
    await prisma.payment.updateMany({
      where: { saleId: sale.id },
      data: { receivableId: receivable.id },
    });
  }

  await prisma.customer.upsert({
    where: { phone: "00000000000" },
    update: {},
    create: {
      name: "Venda avulsa",
      phone: "00000000000",
      notes: "Cliente interno usado quando o módulo de clientes está oculto na interface.",
    },
  });

  console.log("Seed concluído com dados iniciais do Vynce.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
