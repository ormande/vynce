import { ProductStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { getProducts, registerProduct } from "@/modules/products/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    await auth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ProductStatus | "ALL" | null;
    return getProducts({
      search: searchParams.get("q") ?? undefined,
      status: status ?? "ALL",
    });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const body = await request.json();
    const product = await registerProduct(body);
    return { product };
  });
}
