import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { getNotificationsForUser } from "@/modules/notifications/service";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Não autenticado.");
    }

    const notifications = await getNotificationsForUser({
      userId: session.user.id,
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds ?? [],
      accessAll: session.user.accessAll ?? false,
    });

    return { notifications, count: notifications.length };
  });
}
