import { z } from "zod";

export const requestTransferSchema = z.object({
  fromBranchId: z.string().min(1, "Informe a unidade de origem."),
  toBranchId: z.string().min(1, "Informe a unidade de destino."),
  productId: z.string().min(1, "Informe o produto."),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima: 1."),
  notes: z.string().optional().or(z.literal("")),
});

export const confirmTransferSchema = z.object({
  transferId: z.string().min(1),
});

export const cancelTransferSchema = z.object({
  transferId: z.string().min(1),
});

export type RequestTransferInput = z.infer<typeof requestTransferSchema>;
export type ConfirmTransferInput = z.infer<typeof confirmTransferSchema>;
export type CancelTransferInput = z.infer<typeof cancelTransferSchema>;
