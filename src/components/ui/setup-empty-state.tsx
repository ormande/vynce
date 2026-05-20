import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import type { SetupBlock } from "@/lib/setup-blocks";

export function SetupEmptyState({
  block,
  icon: Icon = Sparkles,
  steps,
}: {
  block: SetupBlock;
  icon?: LucideIcon;
  steps?: { label: string; done: boolean }[];
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--panel-strong)] text-[var(--accent)]">
        <Icon className="h-10 w-10 opacity-80" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">{block.title}</h3>
      <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted-foreground)]">
        {block.description}
      </p>

      {steps && steps.length > 0 ? (
        <ul className="mt-8 w-full max-w-md space-y-2 text-left">
          {steps.map((step) => (
            <li
              key={step.label}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm"
            >
              <span
                className={
                  step.done
                    ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
                    : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-xs text-[var(--muted-foreground)]"
                }
              >
                {step.done ? "✓" : "·"}
              </span>
              <span
                className={
                  step.done
                    ? "text-[var(--muted-foreground)] line-through"
                    : "font-medium text-[var(--foreground)]"
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <ActionButton href={block.actionHref} className="mt-8" icon={ArrowRight}>
        {block.actionLabel}
      </ActionButton>

      <Link
        href="/settings"
        className="mt-4 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        Abrir configurações
      </Link>
    </Card>
  );
}
