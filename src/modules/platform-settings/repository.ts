import { db } from "@/lib/db";

const SETTINGS_ID = "default";

export async function findPlatformSettings() {
  return db.platformSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
}

export async function upsertPlatformSettings(data: {
  allowSalesWithoutStock?: boolean;
  singleUnitMode?: boolean;
}) {
  const current = await findPlatformSettings();

  return db.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      allowSalesWithoutStock: data.allowSalesWithoutStock ?? false,
      singleUnitMode: data.singleUnitMode ?? false,
    },
    update: {
      allowSalesWithoutStock:
        data.allowSalesWithoutStock ?? current?.allowSalesWithoutStock ?? false,
      singleUnitMode: data.singleUnitMode ?? current?.singleUnitMode ?? false,
    },
  });
}
