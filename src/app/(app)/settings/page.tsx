import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { requireOwner } from "@/lib/auth-guards";
import { getPlatformSettings } from "@/modules/platform-settings/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireOwner();
  const settings = await getPlatformSettings();

  return (
    <SettingsPageContent
      allowSalesWithoutStock={settings.allowSalesWithoutStock}
      singleUnitMode={settings.singleUnitMode}
    />
  );
}
