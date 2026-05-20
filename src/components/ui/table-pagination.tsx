import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  /** URL base sem query string, ex.: `/sales?tab=records` */
  hrefBase: string;
  /** Parâmetros extras preservados na paginação */
  searchParams?: Record<string, string | undefined>;
};

function buildHref(
  hrefBase: string,
  page: number,
  searchParams?: Record<string, string | undefined>,
) {
  const [path, existingQuery] = hrefBase.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  params.set("page", String(page));
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") {
        params.set(key, value);
      }
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function TablePagination({
  page,
  totalPages,
  hrefBase,
  searchParams,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">
      <p className="text-sm text-[var(--muted-foreground)]">
        Página <span className="font-medium text-[var(--foreground)]">{page}</span> de{" "}
        <span className="font-medium text-[var(--foreground)]">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(hrefBase, page - 1, searchParams)}
            className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.01em] text-[var(--foreground)] transition hover:bg-[var(--panel-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(hrefBase, page + 1, searchParams)}
            className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-[0.01em] text-[var(--foreground)] transition hover:bg-[var(--panel-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Próximo
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        ) : (
          <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled>
            Próximo
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
