import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationCenter } from "@/components/layout/notification-center";

export function AppHeader({
  title,
  subtitle,
  userName,
  roleLabel,
  notificationCount = 0,
}: {
  title: string;
  subtitle: string;
  userName?: string | null;
  roleLabel?: string;
  notificationCount?: number;
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
        <GlobalSearch />
        <div className="flex items-center gap-3">
          <NotificationCenter initialCount={notificationCount} />
          <div className="flex min-h-[5.25rem] min-w-[10.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-white/80 px-5 py-4">
            <p className="max-w-[14rem] shrink-0 truncate text-center text-sm font-medium leading-normal text-[var(--foreground)]">
              {userName || "Equipe Vynce"}
            </p>
            <div className="flex shrink-0 justify-center">
              <Badge className="whitespace-nowrap">{roleLabel || "Acesso operacional"}</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
