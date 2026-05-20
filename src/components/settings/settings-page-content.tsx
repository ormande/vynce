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
import { PlatformPreferences } from "@/components/settings/platform-preferences";

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
] as const;

export function SettingsPageContent({
  allowSalesWithoutStock,
  singleUnitMode,
}: {
  allowSalesWithoutStock: boolean;
  singleUnitMode: boolean;
}) {
  return (
    <div className="space-y-8">
      <PlatformPreferences
        initialAllowSalesWithoutStock={allowSalesWithoutStock}
        initialSingleUnitMode={singleUnitMode}
      />

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Atalhos</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Acesso rápido às áreas administrativas do sistema.
            </p>
          </div>
        </div>

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
                {section.href && section.label ? (
                  <ActionButton href={section.href} className="mt-6 self-start">
                    {section.label}
                  </ActionButton>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
