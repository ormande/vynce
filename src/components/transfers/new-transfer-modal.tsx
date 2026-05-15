"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { TransferRequestForm } from "./transfer-request-form";

type BranchOpt = { id: string; name: string; isWarehouse: boolean };

export function NewTransferModal({
  isOpen,
  onClose,
  branchesFrom,
  branchesToPool,
}: {
  isOpen: boolean;
  onClose: () => void;
  branchesFrom: BranchOpt[];
  branchesToPool: BranchOpt[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Nova Transferência</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Movimente produtos entre as filiais e depósitos.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <TransferRequestForm
            branchesFrom={branchesFrom}
            branchesToPool={branchesToPool}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
