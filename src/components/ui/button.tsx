import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-[var(--accent)] !text-[#fff8f2] shadow-lg shadow-[rgba(19,41,35,0.16)] hover:bg-[var(--accent-strong)]",
        variant === "secondary" &&
          "border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)]",
        variant === "ghost" &&
          "text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}
