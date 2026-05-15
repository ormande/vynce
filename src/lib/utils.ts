import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(value: Date | string) {
  return format(new Date(value), "dd MMM yyyy", { locale: ptBR });
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function startOfDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Saída",
  ADJUSTMENT: "Ajuste",
  SALE: "Venda",
  RETURN: "Devolução",
  TRANSFER_IN: "Recebido",
  TRANSFER_OUT: "Enviado",
};

export function formatMovementType(type: string) {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT_CARD: "Cartão de débito",
  CREDIT_CARD: "Cartão de crédito",
  CREDIT: "Fiado",
};

const SALE_PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  PARTIAL: "Parcial",
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
};

export function formatPaymentMethod(method: string) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function formatSalePaymentStatus(status: string) {
  return SALE_PAYMENT_STATUS_LABELS[status] ?? status;
}

export function parseCurrencyInput(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
