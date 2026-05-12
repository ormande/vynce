import { NextResponse } from "next/server";
import { type NextRequestWithAuth, withAuth } from "next-auth/middleware";

const PATH_HEADER = "x-next-pathname";

/** Repassa o pathname ao layout (App Router) para guards server-side. */
function nextWithPathname(req: NextRequestWithAuth) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(PATH_HEADER, req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function sellerAllowedPath(path: string) {
  if (path.startsWith("/api/auth")) return true;
  if (path === "/signin" || path.startsWith("/signin/")) return true;
  if (path === "/products") return true;
  if (path === "/sales" || path.startsWith("/sales/")) return true;
  if (path === "/inventory" || path.startsWith("/inventory/")) return true;
  if (path === "/transfers" || path.startsWith("/transfers/")) return true;
  if (path === "/unassigned" || path.startsWith("/unassigned/")) return true;
  if (path === "/api/sales" || path.startsWith("/api/sales/")) return true;
  return false;
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const path = req.nextUrl.pathname;

    if (path === "/post-login") {
      return nextWithPathname(req);
    }

    if (path === "/unassigned" || path.startsWith("/unassigned/")) {
      return nextWithPathname(req);
    }

    const token = req.nextauth.token;
    if (!token) {
      return nextWithPathname(req);
    }

    if (token.status === "DISABLED") {
      return NextResponse.redirect(new URL("/signin?error=AccountDisabled", req.url));
    }

    const roleSlug = token.roleSlug as string | undefined;
    if (roleSlug === "owner") {
      return nextWithPathname(req);
    }

    const accessAll = token.accessAll === true;
    const rawBranchIds = token.branchIds;
    const branchIds = Array.isArray(rawBranchIds)
      ? rawBranchIds.map(String)
      : typeof rawBranchIds === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(rawBranchIds) as unknown;
              return Array.isArray(parsed) ? parsed.map(String) : [];
            } catch {
              return [];
            }
          })()
        : [];
    const hasUnitAccess = accessAll || branchIds.length > 0;

    if (!hasUnitAccess) {
      return NextResponse.redirect(new URL("/unassigned", req.url));
    }

    if (roleSlug === "seller" && hasUnitAccess && !sellerAllowedPath(path)) {
      return NextResponse.redirect(new URL("/sales", req.url));
    }

    return nextWithPathname(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/branches",
    "/branches/:path*",
    "/sellers",
    "/sellers/:path*",
    "/inventory",
    "/inventory/:path*",
    "/sales",
    "/sales/:path*",
    "/transfers",
    "/transfers/:path*",
    "/receivables/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/unassigned",
    "/unassigned/:path*",
    "/post-login",
    "/api/customers/:path*",
    "/api/products/:path*",
    "/api/sales",
    "/api/sales/:path*",
    "/api/payments/:path*",
    "/api/dashboard/:path*",
    "/api/reports/:path*",
  ],
};
