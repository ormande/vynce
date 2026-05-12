import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
  variant?: "solid" | "subtle";
};

export function Badge({
  className,
  tone = "neutral",
  variant = "subtle",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "subtle" && [
          tone === "neutral" && "bg-slate-100 text-slate-700",
          tone === "success" && "bg-emerald-100 text-emerald-700",
          tone === "warning" && "bg-amber-100 text-amber-700",
          tone === "danger" && "bg-rose-100 text-rose-700",
        ],
        variant === "solid" && [
          tone === "neutral" && "bg-slate-600 text-white",
          tone === "success" && "bg-emerald-600 text-white",
          tone === "warning" && "bg-amber-600 text-white",
          tone === "danger" && "bg-rose-600 text-white",
        ],
        className,
      )}
      {...props}
    />
  );
}
