import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { permissionCatalog } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/session-permissions";
import { registerStockInbound } from "@/modules/inventory/inbound-service";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = requireApiPermission(
      await auth(),
      permissionCatalog.inventoryWrite,
    );

    const body = await request.json();
    const result = await registerStockInbound(body, session.user.id, {
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds,
    });
    return { result };
  });
}
