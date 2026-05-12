"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cancelTransferAction, confirmTransferAction } from "@/modules/transfers/actions";

export function TransferRowActions({
  transferId,
  status,
  canConfirm,
  canCancel,
}: {
  transferId: string;
  status: string;
  canConfirm: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "PENDING") {
    return null;
  }

  async function handleConfirm() {
    if (!window.confirm("Confirmar recebimento desta transferência? O estoque será atualizado.")) {
      return;
    }
    setError(null);
    setPending(true);
    const res = await confirmTransferAction({ transferId });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.refresh();
  }

  async function handleCancel() {
    if (!window.confirm("Cancelar esta transferência pendente?")) {
      return;
    }
    setError(null);
    setPending(true);
    const res = await cancelTransferAction({ transferId });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {canConfirm ? (
          <Button
            type="button"
            className="rounded-full"
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            Confirmar recebimento
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            disabled={pending}
            onClick={() => void handleCancel()}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
