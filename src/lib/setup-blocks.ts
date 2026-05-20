import type { SetupSnapshot } from "@/modules/setup/service";

export type SetupPageKey =
  | "dashboard"
  | "products"
  | "products-new"
  | "categories"
  | "branches"
  | "sellers"
  | "inventory"
  | "sales"
  | "transfers"
  | "customers"
  | "receivables"
  | "reports"
  | "users";

export type SetupBlock = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

type ResolveOptions = {
  singleUnitMode?: boolean;
};

export function resolveSetupBlock(
  page: SetupPageKey,
  snapshot: SetupSnapshot,
  options: ResolveOptions = {},
): SetupBlock | null {
  const { singleUnitMode = false } = options;

  const needsBranches: SetupBlock = {
    title: "Cadastre uma unidade primeiro",
    description:
      "O sistema precisa de ao menos uma unidade (loja ou ponto de venda) para vincular estoque, vendas e equipe.",
    actionLabel: "Cadastrar unidade",
    actionHref: "/branches/new",
  };

  const needsCategories: SetupBlock = {
    title: "Crie categorias de produtos",
    description:
      "Antes de cadastrar produtos, organize o catálogo com categorias (ex.: Doces, Bebidas).",
    actionLabel: "Gerenciar categorias",
    actionHref: "/products/categories",
  };

  const needsProducts: SetupBlock = {
    title: "Cadastre produtos no catálogo",
    description:
      "Adicione os itens que você vende para registrar estoque, movimentações e vendas.",
    actionLabel: "Adicionar produto",
    actionHref: "/products/new",
  };

  const needsSecondBranch: SetupBlock = {
    title: "Transferências exigem mais de uma unidade",
    description:
      "Cadastre outra filial ou desative o modo unidade única em Configurações se você opera em um só local.",
    actionLabel: "Gerenciar unidades",
    actionHref: "/branches",
  };

  const singleUnitTransfersDisabled: SetupBlock = {
    title: "Transferências desativadas",
    description:
      "No modo unidade única não há movimentação entre filiais. O estoque é gerenciado diretamente em Estoque.",
    actionLabel: "Ir para estoque",
    actionHref: "/inventory",
  };

  const needsSales: SetupBlock = {
    title: "Nenhuma venda registrada ainda",
    description:
      "Registre vendas para acompanhar faturamento, relatórios e contas a receber.",
    actionLabel: "Registrar venda",
    actionHref: "/sales",
  };

  switch (page) {
    case "dashboard": {
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasCategories) return needsCategories;
      if (!snapshot.hasProducts) return needsProducts;
      return null;
    }
    case "branches":
      if (!snapshot.hasBranches) return needsBranches;
      return null;
    case "categories":
      return null;
    case "products":
    case "products-new": {
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasCategories) return needsCategories;
      return null;
    }
    case "sellers": {
      if (!snapshot.hasBranches) return needsBranches;
      return null;
    }
    case "inventory":
    case "sales": {
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasProducts) return needsProducts;
      return null;
    }
    case "transfers": {
      if (singleUnitMode) return singleUnitTransfersDisabled;
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasProducts) return needsProducts;
      if (snapshot.branchCount < 2) return needsSecondBranch;
      return null;
    }
    case "customers": {
      if (!snapshot.hasBranches) return needsBranches;
      return null;
    }
    case "receivables": {
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasProducts) return needsProducts;
      if (!snapshot.hasSales) return needsSales;
      return null;
    }
    case "reports": {
      if (!snapshot.hasBranches) return needsBranches;
      if (!snapshot.hasSales) return needsSales;
      return null;
    }
    case "users":
      return null;
    default:
      return null;
  }
}
