import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { getSales, registerSale } from "@/modules/sales/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }
    const branchIds =
      session.user.roleSlug === "seller" && !session.user.accessAll
        ? session.user.branchIds
        : undefined;
    const { searchParams } = new URL(request.url);
    return getSales(searchParams.get("q") ?? undefined, branchIds);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const body = await request.json();
    const sale = await registerSale(body, session.user.id, {
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds,
    });
    return { sale };
  });
}
