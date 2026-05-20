"use client";

import { ProductStatus } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
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
  productUpdateSchema,
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
    <label className="mb-2 block text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
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
  initialValues,
  onSuccess,
}: {
  categories: { id: string; name: string }[];
  initialValues?: ProductFormValues & { id: string };
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initialValues);

  const form = useForm<ProductFormValues, undefined, ProductInput>({
    resolver: zodResolver(
      isEditing ? productUpdateSchema : productSchema,
    ) as unknown as Resolver<ProductFormValues, undefined, ProductInput>,
    defaultValues: initialValues || {
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
    const url = initialValues ? `/api/products/${initialValues.id}` : "/api/products";
    const method = initialValues ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
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

    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/products");
    }
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {initialValues ? "Editar produto" : "Novo produto"}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {initialValues
            ? "Atualize as informações do item no catálogo."
            : "Cadastre itens com categoria, preço, estoque e status prontos para evolução futura."}
        </p>
      </div>

      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
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

        {!isEditing ? (
          <div>
            <FieldLabel label="Quantidade em estoque (depósito)" required />
            <Input
              placeholder="Ex.: 24"
              inputMode="numeric"
              aria-invalid={!!form.formState.errors.stockQuantity}
              className={
                form.formState.errors.stockQuantity
                  ? `${errorTone.border} ${errorTone.ring}`
                  : undefined
              }
              {...form.register("stockQuantity", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                },
              })}
            />
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              O estoque inicial entra no depósito. Use Estoque para lançar em outras unidades.
            </p>
            <FieldError message={form.formState.errors.stockQuantity?.message} />
          </div>
        ) : (
          <div className="sm:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Para alterar quantidades, use{" "}
            <span className="font-medium text-[var(--foreground)]">Estoque → Adicionar estoque</span>{" "}
            ou transferências entre unidades.
          </div>
        )}

        <div>
          <FieldLabel label="Estoque mínimo" />
          <Input
            placeholder="Ex.: 5"
            inputMode="numeric"
            {...form.register("lowStockThreshold", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              },
            })}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <FieldLabel label="Descrição" />
          <Textarea
            placeholder="Detalhes adicionais do produto"
            {...form.register("description")}
          />
        </div>

        {error ? (
          <p className={`text-sm sm:col-span-2 lg:col-span-3 xl:col-span-4 ${errorTone.text}`}>{error}</p>
        ) : null}

        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <Button type="submit" className="w-full sm:w-auto">Salvar produto</Button>
        </div>
      </form>
    </Card>
  );
}
