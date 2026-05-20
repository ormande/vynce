import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

import { SHOW_RECEIVABLES_MODULE_UI } from "@/lib/platform-config";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const saleSchema = z
  .object({
    branchId: z.string().min(1, "Selecione a unidade."),
    customerId: z.string().min(1, "Cliente da venda não configurado."),
    paymentMethod: z.nativeEnum(PaymentMethod),
    useCustomSoldAt: z.boolean().default(false),
    soldAt: z.string().optional().or(z.literal("")),
    dueDate: z.string().optional().or(z.literal("")),
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
    if (data.useCustomSoldAt) {
      if (!data.soldAt || !isoDateRegex.test(data.soldAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a data da venda.",
          path: ["soldAt"],
        });
      } else {
        const parsed = new Date(`${data.soldAt}T23:59:59`);
        const now = new Date();
        if (Number.isNaN(parsed.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Data da venda inválida.",
            path: ["soldAt"],
          });
        } else if (parsed.getTime() > now.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A data da venda não pode ser futura.",
            path: ["soldAt"],
          });
        }
      }
    }

    if (data.paymentMethod === PaymentMethod.CREDIT) {
      if (!SHOW_RECEIVABLES_MODULE_UI) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vendas fiado não estão disponíveis.",
          path: ["paymentMethod"],
        });
        return;
      }

      if (!data.dueDate || !isoDateRegex.test(data.dueDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a data de vencimento do fiado.",
          path: ["dueDate"],
        });
      }
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;
