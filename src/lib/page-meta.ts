export type PageMeta = {
  title: string;
  subtitle: string;
};

const DEFAULT_PAGE_META: PageMeta = {
  title: "Vynce",
  subtitle: "Gestão comercial integrada para operação, estoque e recebíveis.",
};

/** Correspondência exata do pathname (sem query string). */
const PAGE_META_EXACT: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle:
      "Panorama do negócio com foco em vendas, inadimplência e capacidade operacional.",
  },
  "/customers": {
    title: "Clientes",
    subtitle:
      "Cadastro de clientes com histórico de compras e saldo devedor calculado automaticamente.",
  },
  "/products": {
    title: "Produtos",
    subtitle:
      "Gestão centralizada de catálogo, categorias personalizáveis, preços e status operacional.",
  },
  "/products/new": {
    title: "Novo produto",
    subtitle:
      "Cadastre um novo item no catálogo com preço, categoria e estoque inicial.",
  },
  "/products/categories": {
    title: "Categorias de produtos",
    subtitle:
      "Organize o catálogo com categorias personalizáveis para facilitar buscas e relatórios.",
  },
  "/branches": {
    title: "Unidades",
    subtitle:
      "Filiais, lojas e depósito central. Estoque e vendas são vinculados à unidade selecionada.",
  },
  "/branches/new": {
    title: "Nova unidade",
    subtitle:
      "Inclua uma filial ou ajuste o cadastro do depósito central conforme a operação do negócio.",
  },
  "/sellers": {
    title: "Funcionários",
    subtitle:
      "Gerencie os vendedores da sua equipe, vincule-os a unidades e controle o acesso ao sistema.",
  },
  "/inventory": {
    title: "Estoque",
    subtitle:
      "Monitoramento de quantidades disponíveis, itens críticos e últimas movimentações.",
  },
  "/transfers": {
    title: "Transferências",
    subtitle:
      "Solicite movimentação entre unidades e confirme o recebimento na filial de destino.",
  },
  "/sales": {
    title: "Vendas",
    subtitle:
      "Registro de vendas à vista ou fiado, com atualização automática de estoque e títulos a receber.",
  },
  "/receivables": {
    title: "Contas a receber",
    subtitle:
      "Acompanhamento de vencimentos, pendências e registro de pagamentos recebidos.",
  },
  "/reports": {
    title: "Relatórios",
    subtitle: "Indicadores da empresa e desempenho da equipe de vendas.",
  },
  "/settings": {
    title: "Configurações",
    subtitle:
      "Centralize parâmetros do negócio, catálogo, equipe, unidades e acessos ao sistema.",
  },
  "/users": {
    title: "Usuários",
    subtitle:
      "Visão inicial da base de acessos persistida no banco, com papel e status de cada colaborador.",
  },
};

const BRANCH_DETAIL_META: PageMeta = {
  title: "Detalhes da unidade",
  subtitle: "Unidade cadastrada no sistema multifilial.",
};

const SELLER_DETAIL_META: PageMeta = {
  title: "Detalhes do funcionário",
  subtitle:
    "Gerencie o vínculo com unidades, status da conta e visualize o histórico do funcionário.",
};

/** Prefixos ordenados do mais específico ao mais genérico (rotas aninhadas estáticas). */
const PAGE_META_PREFIX: { prefix: string; meta: PageMeta }[] = [
  { prefix: "/products/categories", meta: PAGE_META_EXACT["/products/categories"] },
  { prefix: "/products/new", meta: PAGE_META_EXACT["/products/new"] },
  { prefix: "/branches/new", meta: PAGE_META_EXACT["/branches/new"] },
  { prefix: "/products", meta: PAGE_META_EXACT["/products"] },
  { prefix: "/branches", meta: PAGE_META_EXACT["/branches"] },
  { prefix: "/sellers", meta: PAGE_META_EXACT["/sellers"] },
];

function isBranchDetailPath(pathname: string) {
  return (
    pathname.startsWith("/branches/") &&
    pathname !== "/branches/new" &&
    pathname.split("/").length === 3
  );
}

function isSellerDetailPath(pathname: string) {
  return pathname.startsWith("/sellers/") && pathname.split("/").length === 3;
}

export function getPageMeta(pathname: string): PageMeta {
  const normalized = pathname.split("?")[0] || "/";

  const exact = PAGE_META_EXACT[normalized];
  if (exact) {
    return exact;
  }

  if (isBranchDetailPath(normalized)) {
    return BRANCH_DETAIL_META;
  }

  if (isSellerDetailPath(normalized)) {
    return SELLER_DETAIL_META;
  }

  for (const { prefix, meta } of PAGE_META_PREFIX) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return meta;
    }
  }

  return DEFAULT_PAGE_META;
}
