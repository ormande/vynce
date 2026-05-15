"use client";

import { cn } from "@/lib/utils";

/** Altura para ~5 itens; acima disso ativa scroll vertical. */
export function PanelScrollList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {children}
    </div>
  );
}
