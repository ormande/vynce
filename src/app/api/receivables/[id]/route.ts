import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { permissionCatalog } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/session-permissions";
import { deleteReceivable, updateReceivable } from "@/modules/payments/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    requireApiPermission(await auth(), permissionCatalog.receivablesWrite);
    const { id } = await context.params;
    const body = await request.json();
    const receivable = await updateReceivable(id, body);
    return { receivable };
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    requireApiPermission(await auth(), permissionCatalog.receivablesWrite);
    const { id } = await context.params;
    await deleteReceivable(id);
    return { ok: true };
  });
}
