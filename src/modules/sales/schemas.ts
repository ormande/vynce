import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const saleSchema = z
  .object({
    branchId: z.string().min(1, "Selecione a unidade."),
    customerId: z.string().min(1, "Cliente da venda não configurado."),
    paymentMethod: z.nativeEnum(PaymentMethod),
    applyDiscount: z.boolean().default(false),
    discount: z.coerce.number().min(0).default(0),
    notes: z.string().optional().or(z.literal("")),
    sessionId: z.string().optional().or(z.literal("")),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.coerce.number().int().min(1),
          unitPrice: z.coerce.number().positive("Informe um valor unitário válido."),
        }),
      )
      .min(1, "Adicione pelo menos um item."),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === PaymentMethod.CREDIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vendas fiado não estão disponíveis.",
        path: ["paymentMethod"],
      });
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;
