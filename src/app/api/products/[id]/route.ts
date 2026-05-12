import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { updateProduct } from "@/modules/products/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user || session.user.roleSlug !== "owner") {
      throw new Error("Apenas o proprietário pode editar produtos.");
    }

    const { id } = await params;
    const body = await request.json();
    const product = await updateProduct(id, body);
    return { product };
  });
}
