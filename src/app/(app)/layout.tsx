import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth-guards";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  const pathname = (await headers()).get("x-next-pathname");
  const onUnassignedScreen =
    pathname === "/unassigned" || pathname?.startsWith("/unassigned/") === true;

  if (pathname && !onUnassignedScreen && session.user.roleSlug !== "owner") {
    const hasUnit =
      session.user.accessAll === true || (session.user.branchIds?.length ?? 0) > 0;
    if (!hasUnit) {
      redirect("/unassigned");
    }
  }

  if (onUnassignedScreen) {
    return children;
  }

  return <AppShell session={session}>{children}</AppShell>;
}
