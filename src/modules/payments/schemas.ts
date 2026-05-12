import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const paymentSchema = z.object({
  receivableId: z.string().min(1, "Selecione um recebível."),
  customerId: z.string().optional(),
  saleId: z.string().optional(),
  amount: z.coerce.number().positive("Informe um valor válido."),
  method: z.nativeEnum(PaymentMethod),
  receivedAt: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
});
