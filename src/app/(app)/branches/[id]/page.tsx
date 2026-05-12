import Link from "next/link";
import { Building2 } from "lucide-react";

import { BranchActiveToggle } from "@/components/branches/branch-active-toggle";
import { BranchEmployeesPanel } from "@/components/branches/branch-employees-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { requireOwner } from "@/lib/auth-guards";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import { getBranchById } from "@/modules/branches/service";

export const dynamic = "force-dynamic";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOwner();
  const canWrite = hasPermission(session.user.permissions, permissionCatalog.branchesWrite);
  const { id } = await params;
  const branch = await getBranchById(id);

  const stocksPreview = branch.branchStocks.slice(0, 24);

  const sellerRows = branch.userBranches
    .filter((ub) => ub.user.role?.slug === "seller")
    .map((ub) => ({
      userId: ub.user.id,
      name: ub.user.name,
      email: ub.user.email,
      image: ub.user.image,
    }));

  return (
    <AppShell
      title={branch.name}
      subtitle={branch.address ?? "Unidade cadastrada no sistema multi-filial."}
      pathname={`/branches/${branch.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={branch.isActive ? "success" : "neutral"}>
            {branch.isActive ? "Ativa" : "Inativa"}
          </Badge>
          {branch.isWarehouse ? <Badge tone="warning">Depósito central</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {canWrite ? <BranchActiveToggle branchId={branch.id} isActive={branch.isActive} /> : null}
          <Link
            href="/branches"
            className="inline-flex items-center rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel-strong)]"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Resumo</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {branch.branchStocks.length} produto(s) com estoque nesta unidade.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Vendedores desta unidade</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Vincule ou remova vendedores com perfil operacional nesta filial.
          </p>
          <div className="mt-6">
            <BranchEmployeesPanel branchId={branch.id} employees={sellerRows} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-xl font-semibold text-[var(--foreground)]">Estoque por produto</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Primeiras {stocksPreview.length} linhas (ordem alfabética).
        </p>
        <Table className="mt-4">
          <thead>
            <tr className="text-left text-sm text-[var(--muted-foreground)]">
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Quantidade</th>
              <th className="px-4 py-2">Mínimo (unidade)</th>
            </tr>
          </thead>
          <tbody>
            {stocksPreview.map((row) => (
              <tr key={row.id} className="bg-[var(--panel-strong)]">
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.product.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {row.product.category.name}
                </td>
                <td className="px-4 py-3 text-sm">{row.quantity}</td>
                <td className="px-4 py-3 text-sm">{row.lowStockThreshold}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AppShell>
  );
}
