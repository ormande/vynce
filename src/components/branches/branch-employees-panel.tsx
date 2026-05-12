"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addUserToBranchAction,
  removeUserFromBranchAction,
  searchEmployeesAction,
} from "@/modules/branches/actions";

export type BranchEmployeeRow = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type SearchUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

function Avatar({
  name,
  email,
  image,
  size = 40,
}: {
  name: string | null;
  email: string | null;
  image: string | null;
  size?: number;
}) {
  const label = (name?.trim() || email?.trim() || "?").slice(0, 1).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--panel-strong)] text-sm font-semibold text-[var(--accent)]"
      style={{ width: size, height: size }}
    >
      {label}
    </div>
  );
}

export function BranchEmployeesPanel({
  branchId,
  employees,
}: {
  branchId: string;
  employees: BranchEmployeeRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setSearchError(null);
        setSearchPending(false);
        return;
      }
      setSearchPending(true);
      setSearchError(null);
      const res = await searchEmployeesAction(branchId, trimmed);
      setSearchPending(false);
      if (!res.ok) {
        setResults([]);
        setSearchError(res.message);
        return;
      }
      setResults(res.users);
    },
    [branchId],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 320);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  async function handleLink(userId: string) {
    setActionError(null);
    setLinkingId(userId);
    const res = await addUserToBranchAction(branchId, userId);
    setLinkingId(null);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setQuery("");
    setResults([]);
    router.refresh();
  }

  async function handleRemove(userId: string) {
    const ok = window.confirm("Remover este vendedor desta unidade?");
    if (!ok) return;
    setActionError(null);
    setRemovingId(userId);
    const res = await removeUserFromBranchAction(branchId, userId);
    setRemovingId(null);
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={`branch-emp-search-${branchId}`} className="text-sm font-medium text-[var(--foreground)]">
          Vincular vendedor
        </label>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Busque por nome ou e-mail (parcial, sem diferenciar maiúsculas).
        </p>
        <div className="relative mt-3">
          <input
            id={`branch-emp-search-${branchId}`}
            type="search"
            autoComplete="off"
            placeholder="Digite para buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)] outline-none ring-[var(--ring)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-2"
          />
          {searchPending ? (
            <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
              Buscando…
            </p>
          ) : null}
          {query.trim() && results.length > 0 ? (
            <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] py-1 shadow-lg">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={linkingId === u.id}
                    onClick={() => void handleLink(u.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-[var(--panel-strong)] disabled:opacity-60"
                  >
                    <Avatar name={u.name} email={u.email} image={u.image} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--foreground)]">
                        {u.name ?? "Sem nome"}
                      </span>
                      <span className="block truncate text-[var(--muted-foreground)]">{u.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {query.trim() && !searchPending && results.length === 0 && !searchError ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Nenhum resultado encontrado.</p>
          ) : null}
          {searchError ? <p className="mt-2 text-sm text-rose-700">{searchError}</p> : null}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)]">Vendedores desta unidade</h4>
        {actionError ? <p className="mt-2 text-sm text-rose-700">{actionError}</p> : null}
        {employees.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">Nenhum vendedor vinculado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {employees.map((row) => (
              <li
                key={row.userId}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3"
              >
                <Avatar name={row.name} email={row.email} image={row.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--foreground)]">{row.name ?? "Sem nome"}</p>
                  <p className="truncate text-sm text-[var(--muted-foreground)]">{row.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 rounded-full text-rose-700 hover:bg-rose-50"
                  disabled={removingId === row.userId}
                  onClick={() => void handleRemove(row.userId)}
                  title="Remover vínculo"
                >
                  <UserMinus className="h-4 w-4" />
                  <span className="sr-only">Remover vínculo</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
