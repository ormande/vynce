"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { PanelScrollList } from "@/components/layout/panel-scroll-list";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchResultGroup } from "@/modules/search/service";

export function GlobalSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as {
        groups?: SearchResultGroup[];
        message?: string;
      };

      if (!res.ok) {
        setGroups([]);
        setError(data.message ?? "Não foi possível buscar.");
        return;
      }

      setGroups(data.groups ?? []);
    } catch {
      setGroups([]);
      setError("Não foi possível buscar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open, runSearch]);

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
    <div ref={containerRef} className="relative min-w-[240px] flex-1 lg:max-w-sm">
      <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <Input
        type="search"
        value={query}
        placeholder="Buscar produto, unidade, funcionário…"
        className="pl-11"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim().length >= 2) {
            void runSearch(query);
          }
        }}
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && (query.trim().length > 0 || groups.length > 0 || loading || error) ? (
        <div className="absolute right-0 left-0 z-50 mt-2 overflow-hidden rounded-[24px] border border-[var(--border-strong)] bg-[var(--panel-strong)] shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          {query.trim().length < 2 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Digite pelo menos 2 caracteres.
            </p>
          ) : loading ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </div>
          ) : error ? (
            <p className="px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : totalItems === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Nenhum resultado para &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <PanelScrollList className="p-2">
              {groups.map((group) => (
                <div key={group.category} className="mb-2 last:mb-0">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {group.category}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={`${group.category}-${item.id}`}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "block rounded-2xl px-3 py-2.5 transition",
                            "hover:bg-white hover:shadow-sm",
                          )}
                        >
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                            {item.snippet}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </PanelScrollList>
          )}
        </div>
      ) : null}
    </div>
  );
}
