import { withErrorHandling } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getReportsOverview } from "@/modules/dashboard/service";

export async function GET() {
  return withErrorHandling(async () => {
    await auth();
    return getReportsOverview();
  });
}
