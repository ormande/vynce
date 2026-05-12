"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toggleBranchActiveAction } from "@/modules/branches/actions";

export function BranchActiveToggle({
  branchId,
  isActive,
  disabled,
}: {
  branchId: string;
  isActive: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    const result = await toggleBranchActiveAction(branchId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="rounded-full"
        disabled={disabled || pending}
        onClick={handleClick}
      >
        {pending ? "Salvando…" : isActive ? "Desativar unidade" : "Reativar unidade"}
      </Button>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
