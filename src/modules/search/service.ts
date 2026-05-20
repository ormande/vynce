import { db } from "@/lib/db";
import { buildMatchSnippet } from "@/lib/search-utils";
import {
  SHOW_CUSTOMERS_MODULE_UI,
  SHOW_RECEIVABLES_MODULE_UI,
} from "@/lib/platform-config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPlatformSettings } from "@/modules/platform-settings/service";

export type SearchResultItem = {
  id: string;
  title: string;
  snippet: string;
  href: string;
};

export type SearchResultGroup = {
  category: string;
  items: SearchResultItem[];
};

const LIMIT_PER_GROUP = 12;

type FieldMatch = { label: string; value: string };

function pickMatch(fields: FieldMatch[], q: string): FieldMatch {
  const needle = q.toLowerCase();
  return fields.find((f) => f.value.toLowerCase().includes(needle)) ?? fields[0];
}

function toItems<T extends { id: string }>(
  items: T[],
  category: string,
  q: string,
  getTitle: (item: T) => string,
  getFields: (item: T) => FieldMatch[],
  getHref: (item: T) => string,
): SearchResultGroup | null {
  if (items.length === 0) return null;

  return {
    category,
    items: items.map((item) => {
      const match = pickMatch(getFields(item), q);
      return {
        id: item.id,
        title: getTitle(item),
        snippet: buildMatchSnippet(match.value, q, match.label),
        href: getHref(item),
      };
    }),
  };
}

export async function globalSearch(
  query: string,
  options?: {
    branchIds?: string[];
    roleSlug?: string | null;
    accessAll?: boolean;
  },
): Promise<SearchResultGroup[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  const branchIds = options?.branchIds ?? [];
  const isOwner = options?.roleSlug === "owner" || options?.accessAll === true;
  const restrictBranches = !isOwner && branchIds.length > 0;

  const { singleUnitMode } = await getPlatformSettings();

  const branchScope = restrictBranches ? { id: { in: branchIds } } : {};
  const saleBranchFilter = restrictBranches ? { branchId: { in: branchIds } } : {};
  const transferScope = restrictBranches
    ? {
        OR: [
          { fromBranchId: { in: branchIds } },
          { toBranchId: { in: branchIds } },
        ],
      }
    : {};

  const [
    products,
    categories,
    branches,
    sellers,
    users,
    sales,
    transfers,
    customers,
  ] = await Promise.all([
    db.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { category: true },
      orderBy: { name: "asc" },
      take: LIMIT_PER_GROUP,
    }),
    db.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: LIMIT_PER_GROUP,
    }),
    db.branch.findMany({
      where: {
        ...branchScope,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: LIMIT_PER_GROUP,
    }),
    isOwner
      ? db.user.findMany({
          where: {
            role: { slug: "seller" },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
          include: {
            userBranches: { include: { branch: true } },
          },
          orderBy: { name: "asc" },
          take: LIMIT_PER_GROUP,
        })
      : Promise.resolve([]),
    isOwner
      ? db.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
          include: { role: true },
          orderBy: { name: "asc" },
          take: LIMIT_PER_GROUP,
        })
      : Promise.resolve([]),
    db.sale.findMany({
      where: {
        ...saleBranchFilter,
        OR: [
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { branch: { name: { contains: q, mode: "insensitive" } } },
          { notes: { contains: q, mode: "insensitive" } },
          {
            items: {
              some: {
                OR: [
                  { product: { name: { contains: q, mode: "insensitive" } } },
                  { product: { code: { contains: q, mode: "insensitive" } } },
                ],
              },
            },
          },
        ],
      },
      include: {
        customer: true,
        branch: true,
        items: { include: { product: true }, take: 3 },
      },
      orderBy: { soldAt: "desc" },
      take: LIMIT_PER_GROUP,
    }),
    singleUnitMode
      ? Promise.resolve([])
      : db.stockTransfer.findMany({
          where: {
            ...transferScope,
            OR: [
              { product: { name: { contains: q, mode: "insensitive" } } },
              { product: { code: { contains: q, mode: "insensitive" } } },
              { fromBranch: { name: { contains: q, mode: "insensitive" } } },
              { toBranch: { name: { contains: q, mode: "insensitive" } } },
              { notes: { contains: q, mode: "insensitive" } },
            ],
          },
          include: {
            product: true,
            fromBranch: true,
            toBranch: true,
          },
          orderBy: { requestedAt: "desc" },
          take: LIMIT_PER_GROUP,
        }),
    SHOW_CUSTOMERS_MODULE_UI
      ? db.customer.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { cpf: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { name: "asc" },
          take: LIMIT_PER_GROUP,
        })
      : Promise.resolve([]),
  ]);

  const groups: SearchResultGroup[] = [];

  const productGroup = toItems(
    products,
    "Produtos",
    q,
    (p) => p.name,
    (p) => [
      { label: "Nome", value: p.name },
      { label: "Código", value: p.code ?? "" },
      { label: "Categoria", value: p.category.name },
      { label: "Descrição", value: p.description ?? "" },
    ],
    (p) => `/products?q=${encodeURIComponent(q)}`,
  );
  if (productGroup) groups.push(productGroup);

  const categoryGroup = toItems(
    categories,
    "Categorias",
    q,
    (c) => c.name,
    (c) => [
      { label: "Nome", value: c.name },
      { label: "Descrição", value: c.description ?? "" },
    ],
    () => `/products/categories`,
  );
  if (categoryGroup) groups.push(categoryGroup);

  const branchGroup = toItems(
    branches,
    "Unidades",
    q,
    (b) => b.name,
    (b) => [
      { label: "Nome", value: b.name },
      { label: "Endereço", value: b.address ?? "" },
      {
        label: "Tipo",
        value: b.isWarehouse ? "Depósito central" : "Filial",
      },
    ],
    (b) => `/branches/${b.id}`,
  );
  if (branchGroup) groups.push(branchGroup);

  const sellerGroup = toItems(
    sellers,
    "Funcionários",
    q,
    (u) => u.name ?? u.email ?? "Sem nome",
    (u) => {
      const branchNames = u.userBranches.map((ub) => ub.branch.name).join(", ");
      return [
        { label: "Nome", value: u.name ?? "" },
        { label: "E-mail", value: u.email ?? "" },
        { label: "Telefone", value: u.phone ?? "" },
        { label: "Unidade", value: branchNames },
      ];
    },
    (u) => `/sellers/${u.id}`,
  );
  if (sellerGroup) groups.push(sellerGroup);

  const userGroup = toItems(
    users.filter((u) => u.role?.slug !== "seller"),
    "Usuários e acessos",
    q,
    (u) => u.name ?? u.email ?? "Usuário",
    (u) => [
      { label: "Nome", value: u.name ?? "" },
      { label: "E-mail", value: u.email ?? "" },
      { label: "Perfil", value: u.role?.name ?? "" },
    ],
    () => `/users`,
  );
  if (userGroup) groups.push(userGroup);

  const salesGroup = toItems(
    sales,
    "Vendas",
    q,
    (s) => `${s.branch.name} · ${formatCurrency(s.total.toString())}`,
    (s) => {
      const productNames = s.items.map((i) => i.product.name).join(", ");
      return [
        { label: "Cliente", value: s.customer.name },
        { label: "Unidade", value: s.branch.name },
        { label: "Produtos", value: productNames },
        { label: "Observações", value: s.notes ?? "" },
      ];
    },
    () => "/sales",
  );
  if (salesGroup) groups.push(salesGroup);

  if (!singleUnitMode) {
    const transferGroup = toItems(
      transfers,
      "Transferências",
      q,
      (t) => `${t.product.name} · ${t.quantity} un.`,
      (t) => [
        { label: "Produto", value: t.product.name },
        { label: "Origem", value: t.fromBranch.name },
        { label: "Destino", value: t.toBranch.name },
        { label: "Observações", value: t.notes ?? "" },
      ],
      () => "/transfers",
    );
    if (transferGroup) groups.push(transferGroup);
  }

  const customerGroup = toItems(
    customers,
    "Clientes",
    q,
    (c) => c.name,
    (c) => [
      { label: "Nome", value: c.name },
      { label: "Telefone", value: c.phone },
      { label: "CPF", value: c.cpf ?? "" },
    ],
    (c) => `/customers?q=${encodeURIComponent(q)}`,
  );
  if (customerGroup) groups.push(customerGroup);

  if (SHOW_RECEIVABLES_MODULE_UI && isOwner) {
    const receivables = await db.receivable.findMany({
      where: {
        OR: [
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { customer: true },
      orderBy: { dueDate: "asc" },
      take: LIMIT_PER_GROUP,
    });

    const receivableGroup = toItems(
      receivables,
      "Recebíveis",
      q,
      (r) => r.customer.name,
      (r) => [
        { label: "Cliente", value: r.customer.name },
        {
          label: "Vencimento",
          value: formatDate(r.dueDate),
        },
        {
          label: "Saldo",
          value: formatCurrency(r.balanceDue.toString()),
        },
      ],
      () => "/receivables",
    );
    if (receivableGroup) groups.push(receivableGroup);
  }

  return groups;
}
