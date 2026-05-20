import { Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { SellersPageContent } from "@/components/sellers/sellers-page-content";
import { SetupEmptyState } from "@/components/ui/setup-empty-state";
import { resolveSetupBlock } from "@/lib/setup-blocks";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { findAllSellers } from "@/modules/sellers/repository";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import { getSetupSnapshot } from "@/modules/setup/service";

export const dynamic = "force-dynamic";

export default async function SellersPage() {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "owner") {
    redirect("/dashboard");
  }

  const [snapshot, settings, sellers] = await Promise.all([
    getSetupSnapshot(),
    getPlatformSettings(),
    findAllSellers(),
  ]);
  const setupBlock = resolveSetupBlock("sellers", snapshot, {
    singleUnitMode: settings.singleUnitMode,
  });

  return (
    <AppShell
      title="Funcionários"
      subtitle="Gerencie os vendedores da sua equipe, vincule-os a unidades e controle o acesso ao sistema."
      pathname="/sellers"
    >
      {setupBlock ? (
        <SetupEmptyState block={setupBlock} icon={Users} />
      ) : (
        <SellersPageContent sellers={sellers} />
      )}
    </AppShell>
  );
}
