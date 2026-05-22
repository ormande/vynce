import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { SHOW_RECEIVABLES_MODULE_UI } from "@/lib/platform-config";
import { permissionCatalog } from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import { requireApiPermission } from "@/lib/session-permissions";
import { getReceivables, registerPayment } from "@/modules/payments/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    if (!SHOW_RECEIVABLES_MODULE_UI) {
      throw new AppError("Módulo de contas a receber indisponível.", 404);
    }
    requireApiPermission(await auth(), permissionCatalog.receivablesRead);
    const { searchParams } = new URL(request.url);
    return getReceivables(searchParams.get("q") ?? undefined);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    if (!SHOW_RECEIVABLES_MODULE_UI) {
      throw new AppError("Módulo de contas a receber indisponível.", 404);
    }
    const session = requireApiPermission(await auth(), permissionCatalog.receivablesWrite);

    const body = await request.json();
    const result = await registerPayment(body, session.user.id);
    if (result && typeof result === "object" && "payment" in result) {
      return result;
    }
    return { payment: result, totalPremium: Number(result.premiumAmount ?? 0) };
  });
}
