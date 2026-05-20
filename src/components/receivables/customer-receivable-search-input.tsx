"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CustomerReceivableGroup } from "@/lib/receivable-groups";
import { cn, formatCurrency } from "@/lib/utils";

const PANEL_MAX_HEIGHT = "min(220px, 40vh)";

export function CustomerReceivableSearchInput({
  groups,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  onSelectGroup,
}: {
  groups: CustomerReceivableGroup[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  onSelectGroup?: (group: CustomerReceivableGroup) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = groups.find((g) => g.customerId === value);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return groups;
    const lower = searchText.toLowerCase();
    return groups.filter((g) => g.customerName.toLowerCase().includes(lower));
  }, [groups, searchText]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleOpen() {
    if (disabled) return;
    setSearchText("");
    setIsOpen(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleSelect(group: CustomerReceivableGroup) {
    onChange(group.customerId);
    onSelectGroup?.(group);
    setIsOpen(false);
    setSearchText("");
  }

  function displayLabel(group: CustomerReceivableGroup) {
    const titles =
      group.titleCount > 1 ? `${group.titleCount} títulos · ` : "";
    return `${group.customerName} (${titles}${formatCurrency(group.totalBalance)})`;
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={isOpen ? "Pesquisar por nome do cliente…" : placeholder}
          value={isOpen ? searchText : selected ? displayLabel(selected) : ""}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              setSearchText("");
            }
            if (e.key === "Enter" && filtered.length === 1) {
              e.preventDefault();
              handleSelect(filtered[0]);
            }
          }}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-[var(--border-strong)] bg-white/80 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
            disabled && "cursor-not-allowed opacity-50",
            isOpen && "border-[var(--accent)] ring-2 ring-[color:rgba(31,90,70,0.12)]",
            selected && !isOpen && "font-medium",
          )}
        />
        {selected && !isOpen && !disabled ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setSearchText("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            tabIndex={-1}
            aria-label="Limpar seleção"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-strong)] shadow-lg animate-slide-down"
          style={{ maxHeight: PANEL_MAX_HEIGHT }}
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Nenhum cliente com título em aberto.
            </p>
          ) : (
            filtered.map((group) => (
              <button
                key={group.customerId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(group);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-[var(--panel)]",
                  group.customerId === value && "bg-accent/5",
                )}
              >
                <span
                  className={cn(
                    "font-medium text-[var(--foreground)]",
                    group.customerId === value && "text-accent",
                  )}
                >
                  {group.customerName}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {group.titleCount > 1
                    ? `${group.titleCount} títulos · saldo total `
                    : "Saldo "}
                  {formatCurrency(group.totalBalance)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
