import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const paymentSchema = z
  .object({
    receivableId: z.string().optional(),
    customerId: z.string().optional(),
    saleId: z.string().optional(),
    amount: z.coerce.number().positive("Informe um valor válido."),
    method: z.nativeEnum(PaymentMethod),
    receivedAt: z.string().min(1),
    note: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.receivableId && !data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o cliente com título em aberto.",
        path: ["customerId"],
      });
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const receivableUpdateSchema = z.object({
  dueDate: z
    .string()
    .min(1, "Informe a data de vencimento.")
    .refine((v) => isoDateRegex.test(v), "Data inválida."),
  notes: z.string().optional().or(z.literal("")),
});
