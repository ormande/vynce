import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

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
