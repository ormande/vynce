import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { permissionCatalog } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/session-permissions";
import { getBranchStockMap } from "@/modules/inventory/inbound-service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = requireApiPermission(await auth(), permissionCatalog.salesRead);
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      throw new AppError("Informe a unidade.", 400);
    }

    if (
      session.user.roleSlug === "seller" &&
      !session.user.accessAll &&
      session.user.branchIds.length > 0 &&
      !session.user.branchIds.includes(branchId)
    ) {
      throw new AppError("Sem permissão para consultar estoque desta unidade.", 403);
    }

    const stockByProduct = await getBranchStockMap(branchId);
    return { branchId, stockByProduct };
  });
}
