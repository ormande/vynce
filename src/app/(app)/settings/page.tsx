import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <AppShell
      title="Configurações"
      subtitle="Área preparada para evolução de parâmetros do negócio, usuários, permissões e preferências operacionais."
      pathname="/settings"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Usuários e acessos
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            A base já está pronta para papéis, permissões por função e exceções por usuário autenticado.
          </p>
          <Link
            href="/users"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white"
          >
            Abrir gestão de usuários
          </Link>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Evolução planejada
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Esta área é o ponto natural para futuras políticas comerciais, preferências de cobrança, auditoria e integrações externas.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
