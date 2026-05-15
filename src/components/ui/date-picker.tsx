"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

function parseDateValue(value?: string) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function toDateValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  invalid = false,
  disabled = false,
  className,
  min,
  max,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value) ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDate = useMemo(() => parseDateValue(min), [min]);
  const maxDate = useMemo(() => parseDateValue(max), [max]);

  const displayLabel = selectedDate
    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
    : placeholder;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { locale: ptBR });
    const gridEnd = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function isDisabledDay(day: Date) {
    if (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) {
      return true;
    }
    if (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate)) {
      return true;
    }
    return false;
  }

  function handleSelectDay(day: Date) {
    if (isDisabledDay(day)) return;
    onChange(toDateValue(day));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-white/90 px-4 text-left text-sm outline-none transition",
          invalid
            ? "border-[#7b3148]/55 focus:border-[#7b3148] focus:ring-2 focus:ring-[color:rgba(123,49,72,0.16)]"
            : "border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
          disabled && "cursor-not-allowed opacity-60",
          selectedDate ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          {displayLabel}
        </span>
        <span className="flex items-center gap-1">
          {clearable && selectedDate && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange("");
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[rgba(255,252,248,0.98)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-xl p-2 text-[var(--muted-foreground)] transition hover:bg-[rgba(17,30,27,0.06)] hover:text-[var(--foreground)]"
              onClick={() => setViewDate((current) => subMonths(current, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize text-[var(--foreground)]">
              {format(viewDate, "MMMM yyyy", { locale: ptBR })}
            </p>
            <button
              type="button"
              className="rounded-xl p-2 text-[var(--muted-foreground)] transition hover:bg-[rgba(17,30,27,0.06)] hover:text-[var(--foreground)]"
              onClick={() => setViewDate((current) => addMonths(current, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((weekday, index) => (
              <span
                key={`${weekday}-${index}`}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const outsideMonth = !isSameMonth(day, viewDate);
              const disabledDay = isDisabledDay(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabledDay}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm transition",
                    selected
                      ? "bg-accent text-accent-foreground shadow-md shadow-[rgba(19,41,35,0.16)]"
                      : "text-[var(--foreground)] hover:bg-[rgba(17,30,27,0.06)]",
                    outsideMonth && !selected && "text-[var(--muted-foreground)]/60",
                    isToday(day) && !selected && "ring-1 ring-[var(--accent)]/30",
                    disabledDay && "cursor-not-allowed opacity-35 hover:bg-transparent",
                  )}
                  onClick={() => handleSelectDay(day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[rgba(49,91,77,0.12)]"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                handleSelectDay(today);
              }}
            >
              Hoje
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
