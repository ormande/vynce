import Link from "next/link";

import { BranchCreateForm } from "@/components/forms/branch-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { requirePermission } from "@/lib/auth-guards";
import { permissionCatalog } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NewBranchPage() {
  await requirePermission(permissionCatalog.branchesWrite);

  return (
    <AppShell
      title="Nova unidade"
      subtitle="Inclua uma filial ou ajuste o cadastro do depósito central conforme a operação do negócio."
      pathname="/branches/new"
    >
      <div className="max-w-2xl">
        <BranchCreateForm />
        <Link
          href="/branches"
          className="mt-6 inline-flex rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--panel-strong)]"
        >
          Voltar para unidades
        </Link>
      </div>
    </AppShell>
  );
}
