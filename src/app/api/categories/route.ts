import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import {
  getCategoriesForManagement,
  registerCategory,
} from "@/modules/products/category-service";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    if (
      !hasPermission(session.user.permissions, permissionCatalog.productsRead) &&
      !hasPermission(session.user.permissions, permissionCatalog.productsWrite)
    ) {
      throw new Error("Sem permissão para visualizar categorias.");
    }

    const categories = await getCategoriesForManagement();
    return { categories };
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    if (!hasPermission(session.user.permissions, permissionCatalog.productsWrite)) {
      throw new Error("Sem permissão para criar categorias.");
    }

    const body = await request.json();
    const category = await registerCategory(body, session.user.id);
    return { category };
  });
}
