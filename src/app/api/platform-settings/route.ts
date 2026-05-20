import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";
import { permissionCatalog } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/session-permissions";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/modules/platform-settings/service";

export async function GET() {
  return withErrorHandling(async () => {
    requireApiPermission(await auth(), permissionCatalog.settingsManage);
    return getPlatformSettings();
  });
}

export async function PATCH(request: Request) {
  return withErrorHandling(async () => {
    requireApiPermission(await auth(), permissionCatalog.settingsManage);
    const body = await request.json();
    const settings = await updatePlatformSettings(body);
    return { settings };
  });
}
