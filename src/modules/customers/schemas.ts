import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(3, "Informe o nome do cliente."),
  phone: z.string().min(8, "Informe um telefone válido."),
  cpf: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
