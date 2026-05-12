import { Bell, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function AppHeader({
  title,
  subtitle,
  userName,
  roleLabel,
}: {
  title: string;
  subtitle: string;
  userName?: string | null;
  roleLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Vynce
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[240px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Buscar cliente, produto ou venda" className="pl-11" />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)]">
            <Bell className="h-4 w-4" />
          </button>
          <div className="rounded-2xl border border-[var(--border-strong)] bg-white/80 px-4 py-2">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {userName || "Equipe Vynce"}
            </p>
            <div className="mt-1">
              <Badge>{roleLabel || "Acesso operacional"}</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
