import { z } from "zod";

export const branchCreateSchema = z.object({
  name: z.string().min(2, "Informe o nome da unidade."),
  address: z.string().optional().or(z.literal("")),
  isWarehouse: z.boolean().optional(),
});

export const branchUpdateSchema = branchCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

/** Formulário do modal de edição (nome + endereço). */
export const branchEditFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da unidade."),
  address: z.string().optional().or(z.literal("")),
});

export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
export type BranchEditFormInput = z.infer<typeof branchEditFormSchema>;
