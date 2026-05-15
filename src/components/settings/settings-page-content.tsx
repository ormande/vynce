import {
  Building2,
  Package,
  Settings2,
  Tag,
  Users,
  UserCog,
} from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Catálogo",
    description:
      "Categorias de produtos usadas no cadastro, filtros e organização do estoque.",
    href: "/products/categories",
    label: "Gerenciar categorias",
    icon: Tag,
  },
  {
    title: "Produtos",
    description:
      "Cadastro central de itens, preços mínimos, estoque inicial e status operacional.",
    href: "/products",
    label: "Abrir produtos",
    icon: Package,
  },
  {
    title: "Unidades",
    description:
      "Filiais, depósito central e configuração de estoque por local.",
    href: "/branches",
    label: "Gerenciar unidades",
    icon: Building2,
  },
  {
    title: "Funcionários",
    description:
      "Vendedores, metas, unidades vinculadas e dados da equipe comercial.",
    href: "/sellers",
    label: "Abrir funcionários",
    icon: Users,
  },
  {
    title: "Usuários e acessos",
    description:
      "Contas de login, papéis, permissões por função e exceções por usuário.",
    href: "/users",
    label: "Gestão de usuários",
    icon: UserCog,
  },
  {
    title: "Preferências do sistema",
    description:
      "Parâmetros globais, integrações e políticas comerciais estarão concentrados aqui conforme o produto evoluir.",
    href: null,
    label: null,
    icon: Settings2,
    comingSoon: true,
  },
] as const;

export function SettingsPageContent() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => {
        const Icon = section.icon;

        return (
          <Card key={section.title} className="flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[var(--foreground)]">
              {section.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-[var(--muted-foreground)]">
              {section.description}
            </p>
            {"comingSoon" in section && section.comingSoon ? (
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Em breve
              </p>
            ) : section.href && section.label ? (
              <ActionButton href={section.href} className="mt-6 self-start">
                {section.label}
              </ActionButton>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
