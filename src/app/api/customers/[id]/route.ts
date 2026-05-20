import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { permissionCatalog } from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import { requireApiPermission } from "@/lib/session-permissions";
import { updateCustomer, deleteCustomer } from "@/modules/customers/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    if (!SHOW_CUSTOMERS_MODULE_UI) {
      throw new AppError("Módulo de clientes indisponível.", 404);
    }
    requireApiPermission(await auth(), permissionCatalog.customersWrite);
    const { id } = await params;
    const body = await request.json();
    const customer = await updateCustomer(id, body);
    return { customer };
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    if (!SHOW_CUSTOMERS_MODULE_UI) {
      throw new AppError("Módulo de clientes indisponível.", 404);
    }
    requireApiPermission(await auth(), permissionCatalog.customersWrite);
    const { id } = await params;
    const result = await deleteCustomer(id);
    return { success: true, mode: result.mode };
  });
}
