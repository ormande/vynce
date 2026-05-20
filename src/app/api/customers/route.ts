import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { permissionCatalog } from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import { requireApiPermission } from "@/lib/session-permissions";
import { getCustomers, registerCustomer } from "@/modules/customers/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    if (!SHOW_CUSTOMERS_MODULE_UI) {
      throw new AppError("Módulo de clientes indisponível.", 404);
    }
    requireApiPermission(await auth(), permissionCatalog.customersRead);
    const { searchParams } = new URL(request.url);
    return getCustomers(searchParams.get("q") ?? undefined);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    if (!SHOW_CUSTOMERS_MODULE_UI) {
      throw new AppError("Módulo de clientes indisponível.", 404);
    }
    requireApiPermission(await auth(), permissionCatalog.customersWrite);

    const body = await request.json();
    const customer = await registerCustomer(body);
    return { customer };
  });
}
