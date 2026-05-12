import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const saleSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente."),
  paymentMethod: z.nativeEnum(PaymentMethod),
  soldAt: z.string().min(1),
  dueDate: z.string().optional().or(z.literal("")),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Adicione pelo menos um item."),
});

export type SaleInput = z.infer<typeof saleSchema>;
