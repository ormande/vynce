import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return session;
}

export async function requireRole(roleSlugs: string[]) {
  const session = await requireSession();

  if (!session.user.roleSlug || !roleSlugs.includes(session.user.roleSlug)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requirePermission(permission: PermissionKey) {
  const session = await requireSession();

  if (!hasPermission(session.user.permissions, permission)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireOwner() {
  const session = await requireSession();

  if (session.user.roleSlug !== "owner") {
    redirect("/dashboard");
  }

  return session;
}
