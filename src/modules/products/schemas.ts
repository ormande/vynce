import { ProductStatus } from "@prisma/client";
import { z } from "zod";

function parseCurrencyLikeValue(value: string | number) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

const currencyInputSchema = z.union([z.string(), z.number()]);
const integerInputSchema = z.union([z.string(), z.number()]);

const requiredCurrency = (label: string) =>
  currencyInputSchema
    .refine((value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) && value > 0;
      }

      return value.trim().length > 0;
    }, `${label} é obrigatório.`)
    .refine((value) => !Number.isNaN(parseCurrencyLikeValue(value)), {
      message: `${label} precisa ser numérico.`,
    })
    .transform((value) => parseCurrencyLikeValue(value))
    .pipe(z.number().positive(`Informe ${label.toLowerCase()} válido.`));

const requiredTextInteger = (label: string) =>
  integerInputSchema
    .refine((value) => {
      if (typeof value === "number") {
        return Number.isFinite(value);
      }

      return value.trim().length > 0;
    }, `${label} é obrigatório.`)
    .refine((value) => !Number.isNaN(Number(value)), {
      message: `${label} precisa ser numérico.`,
    })
    .transform((value) => Number(value))
    .pipe(
      z
        .number()
        .int(`${label} deve ser inteiro.`)
        .min(0, `${label} não pode ser negativo.`),
    );

const optionalTextIntegerWithDefault = (label: string, fallback: number) =>
  integerInputSchema
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return Number(value);
    })
    .refine((value) => !Number.isNaN(value), {
      message: `${label} precisa ser numérico.`,
    })
    .pipe(
      z
        .number()
        .int(`${label} deve ser inteiro.`)
        .min(0, `${label} não pode ser negativo.`),
    );

const productStatusField = z
  .string()
  .min(1, "Selecione um status.")
  .transform((value) => value as ProductStatus)
  .refine((value) => Object.values(ProductStatus).includes(value), {
    message: "Selecione um status válido.",
  });

const productCoreObject = z.object({
  name: z.string().min(3, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  costPrice: requiredCurrency("Preço de custo"),
  salePrice: requiredCurrency("Preço sugerido de venda"),
  minPrice: requiredCurrency("Preço mínimo de venda"),
  lowStockThreshold: optionalTextIntegerWithDefault("Estoque mínimo", 5),
  status: productStatusField,
  code: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

function assertMinPriceNotAboveSalePrice(
  data: { minPrice: number; salePrice: number },
  ctx: z.RefinementCtx,
) {
  if (data.minPrice > data.salePrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O preço mínimo não pode ser maior que o preço sugerido de venda.",
      path: ["minPrice"],
    });
  }
}

export const productUpdateSchema = productCoreObject.superRefine(
  assertMinPriceNotAboveSalePrice,
);

export const productSchema = productCoreObject
  .extend({
    stockQuantity: requiredTextInteger("Quantidade em estoque"),
  })
  .superRefine(assertMinPriceNotAboveSalePrice);

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductInput = z.output<typeof productSchema>;
export type ProductUpdateInput = z.output<typeof productUpdateSchema>;
