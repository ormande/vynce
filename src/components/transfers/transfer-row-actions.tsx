"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "CONFIRM" | "CANCEL" | null;
  }>({
    isOpen: false,
    type: null,
  });

  if (status !== "PENDING") {
    return null;
  }

  async function handleConfirm() {
    setError(null);
    setPending(true);
    const res = await confirmTransferAction({ transferId });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      toast.error("Erro ao confirmar recebimento", { description: res.message });
      setConfirmModal({ isOpen: false, type: null });
      return;
    }
    toast.success("Transferência confirmada com sucesso!");
    setConfirmModal({ isOpen: false, type: null });
    router.refresh();
  }

  async function handleCancel() {
    setError(null);
    setPending(true);
    const res = await cancelTransferAction({ transferId });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      toast.error("Erro ao cancelar transferência", { description: res.message });
      setConfirmModal({ isOpen: false, type: null });
      return;
    }
    toast.success("Transferência cancelada.");
    setConfirmModal({ isOpen: false, type: null });
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
            onClick={() => setConfirmModal({ isOpen: true, type: "CONFIRM" })}
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
            onClick={() => setConfirmModal({ isOpen: true, type: "CANCEL" })}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}

      <ConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === "CONFIRM"}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={() => void handleConfirm()}
        title="Confirmar Recebimento"
        description="Deseja confirmar o recebimento desta transferência? O estoque das unidades envolvidas será atualizado automaticamente."
        confirmLabel="Confirmar Recebimento"
        loading={pending}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === "CANCEL"}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={() => void handleCancel()}
        title="Cancelar Transferência"
        description="Tem certeza que deseja cancelar esta transferência pendente? Esta ação não pode ser desfeita."
        confirmLabel="Sim, cancelar"
        variant="danger"
        loading={pending}
      />
    </div>
  );
}
