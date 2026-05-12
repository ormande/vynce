"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  customerSchema,
  type CustomerInput,
} from "@/modules/customers/schemas";

export function CustomerForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      cpf: "",
      address: "",
      notes: "",
    },
  });

  async function onSubmit(values: CustomerInput) {
    setError(null);
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Não foi possível salvar o cliente.");
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Novo cliente</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Cadastre clientes com dados essenciais e deixe histórico e saldo serem calculados automaticamente.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="md:col-span-2">
          <Input placeholder="Nome do cliente" {...form.register("name")} />
        </div>
        <Input placeholder="Telefone" {...form.register("phone")} />
        <Input placeholder="CPF (opcional)" {...form.register("cpf")} />
        <div className="md:col-span-2">
          <Input placeholder="Endereço" {...form.register("address")} />
        </div>
        <div className="md:col-span-2">
          <Textarea placeholder="Observações" {...form.register("notes")} />
        </div>
        {error ? (
          <p className="text-sm text-rose-600 md:col-span-2">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <Button type="submit">Salvar cliente</Button>
        </div>
      </form>
    </Card>
  );
}
