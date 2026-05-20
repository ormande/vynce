import { z } from "zod";

import { onlyDigits } from "@/lib/utils";

export const customerSchema = z.object({
  name: z.string().min(3, "Informe o nome do cliente."),
  phone: z
    .string()
    .min(1, "Informe um telefone válido.")
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length >= 10 && digits.length <= 11;
    }, "Informe um telefone com DDD (10 ou 11 dígitos)."),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => {
      if (!value) return true;
      const digits = onlyDigits(value);
      return digits.length === 0 || digits.length === 11;
    }, "CPF deve ter 11 dígitos."),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
