"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type CustomerSearchOption = {
  id: string;
  name: string;
  phone?: string | null;
  isWalkIn?: boolean;
};

export function CustomerSearchInput({
  customers,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  customers: CustomerSearchOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === value);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return customers;
    const lower = searchText.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone?.toLowerCase().includes(lower),
    );
  }, [customers, searchText]);

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

  function handleSelect(id: string) {
    onChange(id);
    setIsOpen(false);
    setSearchText("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
    if (!isOpen) setIsOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchText("");
    }
    if (e.key === "Enter" && filtered.length === 1) {
      e.preventDefault();
      handleSelect(filtered[0].id);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={isOpen ? "Pesquisar por nome ou telefone…" : placeholder}
          value={isOpen ? searchText : (selectedCustomer?.name ?? "")}
          onChange={handleInputChange}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-[var(--border-strong)] bg-white/80 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
            disabled && "cursor-not-allowed opacity-50",
            isOpen && "border-[var(--accent)] ring-2 ring-[color:rgba(31,90,70,0.12)]",
            selectedCustomer && !isOpen && "font-medium",
          )}
        />
        {selectedCustomer && !isOpen && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setSearchText("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            tabIndex={-1}
            aria-label="Remover cliente"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-strong)] shadow-lg animate-slide-down">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Nenhum cliente encontrado.
            </p>
          ) : (
            filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(customer.id);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-[var(--panel)]",
                  customer.id === value && "bg-accent/5",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium text-[var(--foreground)]",
                    customer.id === value && "text-accent",
                  )}
                >
                  {customer.name}
                </span>
                {customer.phone ? (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {customer.phone}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
