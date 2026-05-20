import { AppShell } from "@/components/layout/app-shell";
import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { requireOwner } from "@/lib/auth-guards";
import { getPlatformSettings } from "@/modules/platform-settings/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireOwner();
  const settings = await getPlatformSettings();

  return (
    <AppShell
      title="Configurações"
      subtitle="Centralize parâmetros do negócio, catálogo, equipe, unidades e acessos ao sistema."
      pathname="/settings"
    >
      <SettingsPageContent
        allowSalesWithoutStock={settings.allowSalesWithoutStock}
        singleUnitMode={settings.singleUnitMode}
      />
    </AppShell>
  );
}
