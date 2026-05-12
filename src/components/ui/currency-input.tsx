"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

function formatCurrencyFromDigits(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const integerValue = Number(digits) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(integerValue);
}

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value?: string;
  onChange?: (value: string) => void;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        inputMode="numeric"
        className={cn(
          "h-11 w-full rounded-2xl border border-[var(--border-strong)] bg-white/90 px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
          className,
        )}
        value={value}
        onChange={(event) => {
          onChange?.(formatCurrencyFromDigits(event.target.value));
        }}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
