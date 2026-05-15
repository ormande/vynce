import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria.").max(80),
  description: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
