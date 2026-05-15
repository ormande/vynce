import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import {
  reactivateCategory,
  removeCategory,
  updateCategoryById,
} from "@/modules/products/category-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    if (!hasPermission(session.user.permissions, permissionCatalog.productsWrite)) {
      throw new Error("Sem permissão para editar categorias.");
    }

    const { id } = await context.params;
    const body = await request.json();
    const category = await updateCategoryById(id, body);
    return { category };
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    if (!hasPermission(session.user.permissions, permissionCatalog.productsWrite)) {
      throw new Error("Sem permissão para remover categorias.");
    }

    const { id } = await context.params;
    const category = await removeCategory(id);
    return { category };
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    if (!hasPermission(session.user.permissions, permissionCatalog.productsWrite)) {
      throw new Error("Sem permissão para editar categorias.");
    }

    const { id } = await context.params;
    const body = (await request.json()) as { action?: string };

    if (body.action === "reactivate") {
      const category = await reactivateCategory(id);
      return { category };
    }

    throw new Error("Ação inválida.");
  });
}
