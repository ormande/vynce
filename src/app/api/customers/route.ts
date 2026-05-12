import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { getCustomers, registerCustomer } from "@/modules/customers/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    await auth();
    const { searchParams } = new URL(request.url);
    return getCustomers(searchParams.get("q") ?? undefined);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const body = await request.json();
    const customer = await registerCustomer(body);
    return { customer };
  });
}
