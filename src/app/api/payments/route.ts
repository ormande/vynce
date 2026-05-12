import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { getReceivables, registerPayment } from "@/modules/payments/service";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    await auth();
    const { searchParams } = new URL(request.url);
    return getReceivables(searchParams.get("q") ?? undefined);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const body = await request.json();
    const payment = await registerPayment(body, session.user.id);
    return { payment };
  });
}
