"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { useAnimatedModal } from "@/lib/use-animated-modal";

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const { shouldRender, isClosing } = useAnimatedModal(isOpen);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-6">
          <p className="text-[var(--muted-foreground)]">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--panel)] px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="rounded-full"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "primary" : "primary"} // Button component might not have danger variant, using primary for both but could be customized
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full ${variant === 'danger' ? '!bg-rose-600 hover:!bg-rose-700 !text-white' : ''}`}
          >
            {loading ? "Processando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
