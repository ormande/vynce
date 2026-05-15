import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth-guards";
import { listUsers } from "@/modules/users/repository";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole(["owner"]);
  const users = await listUsers();

  return (
    <AppShell
      title="Usuários"
      subtitle="Visão inicial da base de acessos persistida no banco, com papel e status de cada colaborador."
      pathname="/users"
    >
      <Card>
        <Table>
          <thead>
            <tr className="text-center text-sm text-[var(--muted-foreground)]">
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2">Perfil</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-3">
                      <Users className="h-6 w-6 opacity-40" />
                    </div>
                    <p>Nenhum usuário encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md text-center">
                  <td className="rounded-l-3xl px-4 py-4 font-medium text-[var(--foreground)] text-left">
                    {user.name || "Usuário sem nome"}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {user.email}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={user.role?.slug === "owner" ? "success" : "neutral"}>
                      {user.role?.name || "Sem função"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {user.status}
                  </td>
                  <td className="rounded-r-3xl px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </AppShell>
  );
}
