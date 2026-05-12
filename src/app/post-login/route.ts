import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Destino após OAuth: usa sessão (callbacks + Prisma) para decidir
 * dashboard, vendas ou tela de espera sem unidade.
 * Fora de /api/auth para o middleware do NextAuth não ignorar a rota.
 */
export async function GET(request: Request) {
  const session = await auth();
  const base = new URL(request.url).origin;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", base));
  }

  if (session.user.roleSlug === "owner") {
    return NextResponse.redirect(new URL("/dashboard", base));
  }

  const hasUnit =
    session.user.accessAll === true || (session.user.branchIds?.length ?? 0) > 0;

  if (!hasUnit) {
    return NextResponse.redirect(new URL("/unassigned", base));
  }

  if (session.user.roleSlug === "seller") {
    return NextResponse.redirect(new URL("/sales", base));
  }

  return NextResponse.redirect(new URL("/dashboard", base));
}
