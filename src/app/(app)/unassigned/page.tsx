import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth-guards";

import { UnassignedContent } from "./unassigned-content";

export const dynamic = "force-dynamic";

export default async function UnassignedPage() {
  const session = await requireSession();

  if (session.user.roleSlug === "owner") {
    redirect("/dashboard");
  }

  const branchIds = session.user.branchIds ?? [];
  if (session.user.accessAll || branchIds.length > 0) {
    redirect("/dashboard");
  }

  /* Conta autenticada sem vínculo a unidade: permanece nesta tela até o admin configurar. */
  return <UnassignedContent email={session.user.email ?? ""} />;
}
