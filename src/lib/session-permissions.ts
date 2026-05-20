import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

export function requireApiSession(session: Session | null) {
  if (!session?.user) {
    throw new AppError("Não autenticado.", 401);
  }
  return session;
}

export function requireApiPermission(
  session: Session | null,
  permission: PermissionKey,
) {
  const authenticated = requireApiSession(session);
  if (!hasPermission(authenticated.user.permissions, permission)) {
    throw new AppError("Sem permissão para esta ação.", 403);
  }
  return authenticated;
}
