"use client";

import { ProductStatus } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DropdownSelect,
  type DropdownOption,
} from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  productSchema,
  type ProductFormValues,
  type ProductInput,
} from "@/modules/products/schemas";

const errorTone = {
  border: "border-[#7b3148]/55",
  ring: "focus:border-[#7b3148] focus:ring-[color:rgba(123,49,72,0.16)]",
  text: "text-[#7b3148]",
};

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
      {label}
      {required ? <span className="ml-1 text-[#7b3148]">*</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className={`mt-2 text-xs ${errorTone.text}`}>{message}</p>;
}

export function ProductForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProductFormValues, undefined, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      costPrice: "",
      salePrice: "",
      minPrice: "",
      stockQuantity: "",
      lowStockThreshold: "",
      status: "",
      code: "",
      description: "",
    },
  });

  const categoryOptions: DropdownOption[] = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const statusOptions: DropdownOption[] = [
    { label: "Ativo", value: ProductStatus.ACTIVE },
    { label: "Inativo", value: ProductStatus.INACTIVE },
  ];

  async function onSubmit(values: ProductInput) {
    setError(null);
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = (await response.json()) as {
        message?: string;
        issues?: {
          fieldErrors?: Record<string, string[] | undefined>;
          formErrors?: string[];
        };
      };

      const firstFieldError = Object.values(data.issues?.fieldErrors ?? {})
        .flat()
        .find(Boolean);

      setError(
        firstFieldError ||
          data.issues?.formErrors?.[0] ||
          data.message ||
          "Não foi possível salvar o produto.",
      );
      return;
    }

    form.reset({
      name: "",
      categoryId: "",
      costPrice: "",
      salePrice: "",
      minPrice: "",
      stockQuantity: "",
      lowStockThreshold: "",
      status: "",
      code: "",
      description: "",
    });
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Novo produto
        </h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Cadastre itens com categoria, preço, estoque e status prontos para
          evolução futura.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="md:col-span-2">
          <FieldLabel label="Nome do produto" required />
          <Input
            placeholder="Ex.: Café torrado premium"
            aria-invalid={!!form.formState.errors.name}
            className={
              form.formState.errors.name
                ? `${errorTone.border} ${errorTone.ring}`
                : undefined
            }
            {...form.register("name")}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div>
          <FieldLabel label="Categoria" required />
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <DropdownSelect
                value={field.value}
                onChange={field.onChange}
                options={categoryOptions}
                placeholder="Selecione uma categoria"
                invalid={!!form.formState.errors.categoryId}
              />
            )}
          />
          <FieldError message={form.formState.errors.categoryId?.message} />
        </div>

        <div>
          <FieldLabel label="Status" required />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <DropdownSelect
                value={field.value}
                onChange={field.onChange}
                options={statusOptions}
                placeholder="Selecione o status"
                invalid={!!form.formState.errors.status}
              />
            )}
          />
          <FieldError message={form.formState.errors.status?.message} />
        </div>

        <div>
          <FieldLabel label="Código" />
          <Input placeholder="Ex.: SKU-1024" {...form.register("code")} />
        </div>

        <div>
          <FieldLabel label="Preço de custo" required />
          <Controller
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <CurrencyInput
                placeholder="R$ 0,00"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={field.onChange}
                aria-invalid={!!form.formState.errors.costPrice}
                className={
                  form.formState.errors.costPrice
                    ? `${errorTone.border} ${errorTone.ring}`
                    : undefined
                }
              />
            )}
          />
          <FieldError message={form.formState.errors.costPrice?.message} />
        </div>

        <div>
          <FieldLabel label="Preço sugerido de venda" required />
          <Controller
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <CurrencyInput
                placeholder="R$ 0,00"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={field.onChange}
                aria-invalid={!!form.formState.errors.salePrice}
                className={
                  form.formState.errors.salePrice
                    ? `${errorTone.border} ${errorTone.ring}`
                    : undefined
                }
              />
            )}
          />
          <FieldError message={form.formState.errors.salePrice?.message} />
        </div>

        <div>
          <FieldLabel label="Preço mínimo de venda" required />
          <Controller
            control={form.control}
            name="minPrice"
            render={({ field }) => (
              <CurrencyInput
                placeholder="R$ 0,00"
                value={field.value === undefined ? "" : String(field.value)}
                onChange={field.onChange}
                aria-invalid={!!form.formState.errors.minPrice}
                className={
                  form.formState.errors.minPrice
                    ? `${errorTone.border} ${errorTone.ring}`
                    : undefined
                }
              />
            )}
          />
          <FieldError message={form.formState.errors.minPrice?.message} />
        </div>

        <div>
          <FieldLabel label="Quantidade em estoque" required />
          <Input
            placeholder="Ex.: 24"
            inputMode="numeric"
            aria-invalid={!!form.formState.errors.stockQuantity}
            className={
              form.formState.errors.stockQuantity
                ? `${errorTone.border} ${errorTone.ring}`
                : undefined
            }
            {...form.register("stockQuantity")}
          />
          <FieldError message={form.formState.errors.stockQuantity?.message} />
        </div>

        <div>
          <FieldLabel label="Estoque mínimo" />
          <Input
            placeholder="Ex.: 5"
            inputMode="numeric"
            {...form.register("lowStockThreshold")}
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel label="Descrição" />
          <Textarea
            placeholder="Detalhes adicionais do produto"
            {...form.register("description")}
          />
        </div>

        {error ? (
          <p className={`text-sm md:col-span-2 ${errorTone.text}`}>{error}</p>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit">Salvar produto</Button>
        </div>
      </form>
    </Card>
  );
}
