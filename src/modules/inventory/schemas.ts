import { z } from "zod";

export const stockInboundSchema = z.object({
  branchId: z.string().min(1, "Selecione a unidade."),
  productId: z.string().min(1, "Selecione o produto."),
  quantity: z.coerce
    .number()
    .int("Informe uma quantidade inteira.")
    .positive("A quantidade deve ser maior que zero."),
  note: z.string().optional().or(z.literal("")),
});
