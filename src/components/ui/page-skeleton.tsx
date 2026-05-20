import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[var(--panel-strong)] ring-1 ring-[var(--border)]",
        className,
      )}
    />
  );
}

/** Esqueleto só da área de conteúdo (casca fixa no layout). */
export function AppShellSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando conteúdo">
      <SkeletonBlock className="h-12 w-full max-w-xs" />
      <SkeletonBlock className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-32 w-full" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
      <SkeletonBlock className="h-24 w-full" />
    </div>
  );
}
