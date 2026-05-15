import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { globalSearch } from "@/modules/search/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";

    const isSeller =
      session.user.roleSlug === "seller" && !session.user.accessAll;

    const groups = await globalSearch(q, {
      branchIds: isSeller ? session.user.branchIds : undefined,
      roleSlug: session.user.roleSlug,
      accessAll: session.user.accessAll,
    });
    return { groups };
  });
}
