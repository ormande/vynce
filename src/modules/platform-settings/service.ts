import { z } from "zod";

import {
  findPlatformSettings,
  upsertPlatformSettings,
} from "@/modules/platform-settings/repository";

const updateSettingsSchema = z
  .object({
    allowSalesWithoutStock: z.boolean().optional(),
    singleUnitMode: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.allowSalesWithoutStock !== undefined ||
      data.singleUnitMode !== undefined,
    { message: "Informe ao menos uma preferência." },
  );

export async function getPlatformSettings() {
  const row = await findPlatformSettings();
  return {
    allowSalesWithoutStock: row?.allowSalesWithoutStock ?? false,
    singleUnitMode: row?.singleUnitMode ?? false,
  };
}

export async function updatePlatformSettings(input: unknown) {
  const data = updateSettingsSchema.parse(input);
  const current = await getPlatformSettings();
  const row = await upsertPlatformSettings({
    allowSalesWithoutStock:
      data.allowSalesWithoutStock ?? current.allowSalesWithoutStock,
    singleUnitMode: data.singleUnitMode ?? current.singleUnitMode,
  });
  return {
    allowSalesWithoutStock: row.allowSalesWithoutStock,
    singleUnitMode: row.singleUnitMode,
  };
}
