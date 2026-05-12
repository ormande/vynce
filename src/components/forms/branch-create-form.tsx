"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBranchAction } from "@/modules/branches/actions";
import {
  branchCreateSchema,
  type BranchCreateInput,
} from "@/modules/branches/schemas";
import type { z } from "zod";

type BranchCreateFormValues = z.input<typeof branchCreateSchema>;

export function BranchCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<BranchCreateFormValues, undefined, BranchCreateInput>({
    resolver: zodResolver(branchCreateSchema),
    defaultValues: {
      name: "",
      address: "",
      isWarehouse: false,
    },
  });

  async function onSubmit(values: BranchCreateInput) {
    setError(null);
    const result = await createBranchAction(values);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    form.reset();
    router.push("/branches");
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Nova unidade</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Cadastre filiais ou o depósito central. Novos produtos passam a ter linha de estoque em todas as
          unidades ativas.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Nome <span className="text-rose-700">*</span>
          </label>
          <Input placeholder="Ex.: Loja Centro" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="mt-2 text-xs text-rose-700">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Endereço</label>
          <Input placeholder="Rua, número, bairro" {...form.register("address")} />
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <Controller
            control={form.control}
            name="isWarehouse"
            render={({ field }) => (
              <input
                type="checkbox"
                id="isWarehouse"
                className="h-4 w-4 rounded border-[var(--border-strong)]"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <label htmlFor="isWarehouse" className="text-sm text-[var(--foreground)]">
            Esta unidade é o depósito central (estoque inicial de novos produtos)
          </label>
        </div>

        {error ? <p className="text-sm text-rose-700 md:col-span-2">{error}</p> : null}

        <div className="md:col-span-2">
          <Button type="submit">Salvar unidade</Button>
        </div>
      </form>
    </Card>
  );
}
