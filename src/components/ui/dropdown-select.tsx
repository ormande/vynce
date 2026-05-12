"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
};

export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
  disabled = false,
  className,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-white/90 px-4 text-left text-sm text-[var(--foreground)] outline-none transition",
          invalid
            ? "border-[#7b3148]/55 focus:border-[#7b3148] focus:ring-2 focus:ring-[color:rgba(123,49,72,0.16)]"
            : "border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={cn(
            "truncate",
            selectedOption ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition",
            open && "rotate-180",
            invalid ? "text-[#7b3148]" : "text-[var(--muted-foreground)]",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[rgba(255,252,248,0.98)] p-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="space-y-1">
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                    selected
                      ? "bg-[rgba(49,91,77,0.12)] text-[var(--accent-strong)]"
                      : "text-[var(--foreground)] hover:bg-[rgba(17,30,27,0.06)]",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
