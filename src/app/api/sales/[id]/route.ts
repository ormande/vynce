import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { permissionCatalog } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/session-permissions";
import { deleteSale, updateSale } from "@/modules/sales/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = requireApiPermission(await auth(), permissionCatalog.salesWrite);
    const { id } = await context.params;
    const body = await request.json();
    const sale = await updateSale(id, body, {
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds,
    });
    return { sale };
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = requireApiPermission(await auth(), permissionCatalog.salesWrite);
    const { id } = await context.params;
    await deleteSale(id, {
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds,
    });
    return { ok: true };
  });
}
