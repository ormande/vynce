/** Fuso fixo do Brasil (sem horário de verão desde 2019). */
export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

/** Chave de calendário `yyyy-MM-dd` no horário de Brasília. */
export function toBrazilDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Dia do mês (1–31) no calendário de Brasília. */
export function getBrazilDayOfMonth(date: Date): number {
  return Number(toBrazilDateKey(date).slice(8, 10));
}

export function parseBrazilDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

/** Início do dia civil em Brasília (instante UTC equivalente). */
export function brazilStartOfDay(dateKey: string): Date {
  const { year, month, day } = parseBrazilDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

/** Fim do dia civil em Brasília (23:59:59.999 BRT). */
export function brazilEndOfDay(dateKey: string): Date {
  const start = brazilStartOfDay(dateKey);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function shiftBrazilDateKey(dateKey: string, days: number): string {
  const start = brazilStartOfDay(dateKey);
  return toBrazilDateKey(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

export type BrazilMonthWindow = {
  year: number;
  month: number;
  daysInMonth: number;
  start: Date;
  end: Date;
  monthKey: string;
};

/** Janela do mês corrente (ou de `reference`) no calendário de Brasília. */
export function getBrazilMonthWindow(reference = new Date()): BrazilMonthWindow {
  const refKey = toBrazilDateKey(reference);
  const { year, month } = parseBrazilDateKey(refKey);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const startKey = `${monthKey}-01`;
  const endKey = `${monthKey}-${String(daysInMonth).padStart(2, "0")}`;

  return {
    year,
    month,
    daysInMonth,
    start: brazilStartOfDay(startKey),
    end: brazilEndOfDay(endKey),
    monthKey,
  };
}

/** Meio-dia em Brasília para gravar `soldAt` de data escolhida (evita mudar de dia em UTC). */
export function brazilNoonFromDateKey(dateKey: string): Date {
  const start = brazilStartOfDay(dateKey);
  return new Date(start.getTime() + 12 * 60 * 60 * 1000);
}

const ISO_DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Interpreta `yyyy-MM-dd` no calendário de Brasília; demais formatos passam por `Date` nativo. */
export function parseBrazilDateInput(value: string): Date {
  if (ISO_DATE_KEY.test(value)) {
    return brazilNoonFromDateKey(value);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data inválida.");
  }
  return parsed;
}
