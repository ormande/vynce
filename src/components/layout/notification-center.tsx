"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, X } from "lucide-react";

import { PanelScrollList } from "@/components/layout/panel-scroll-list";
import {
  dismissNotificationBadge,
  isNotificationBadgeDismissed,
} from "@/lib/notification-badge-storage";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/modules/notifications/service";

export function NotificationCenter({
  initialCount = 0,
}: {
  initialCount?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const syncBadgeCount = useCallback((serverCount: number) => {
    if (isNotificationBadgeDismissed()) {
      setCount(0);
      return;
    }
    setCount(serverCount);
  }, []);

  useEffect(() => {
    setMounted(true);
    syncBadgeCount(initialCount);
  }, [initialCount, syncBadgeCount]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications");
      const data = (await res.json()) as {
        notifications?: AppNotification[];
        message?: string;
      };

      if (!res.ok) {
        setError(data.message ?? "Não foi possível carregar notificações.");
        return;
      }

      setNotifications(data.notifications ?? []);
    } catch {
      setError("Não foi possível carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, []);

  function openModal() {
    dismissNotificationBadge();
    setCount(0);
    setIsOpen(true);
    void loadNotifications();
  }

  const grouped = notifications.reduce<Record<string, AppNotification[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const categoryOrder = Object.keys(grouped);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] transition hover:bg-[var(--panel-strong)]"
        aria-label="Central de notificações"
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {isOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
              <div
                className="absolute inset-0"
                onClick={() => setIsOpen(false)}
                aria-hidden
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="notifications-title"
                className="relative flex w-full max-w-lg max-h-[min(85vh,560px)] flex-col overflow-hidden rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 shrink-0">
                  <div>
                    <h3
                      id="notifications-title"
                      className="text-xl font-semibold text-[var(--foreground)]"
                    >
                      Notificações
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Alertas operacionais do sistema
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 px-2 py-2">
                  {loading ? (
                    <div className="flex items-center gap-2 px-4 py-8 text-sm text-[var(--muted-foreground)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando…
                    </div>
                  ) : error ? (
                    <p className="px-4 py-6 text-sm text-rose-700">{error}</p>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                      Nenhuma notificação no momento.
                    </p>
                  ) : (
                    <PanelScrollList className="px-1">
                      {categoryOrder.map((category) => (
                        <div key={category} className="mb-2 last:mb-0">
                          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                            {category}
                          </p>
                          <ul className="space-y-1">
                            {grouped[category].map((item) => (
                              <li key={item.id}>
                                <Link
                                  href={item.href}
                                  onClick={() => setIsOpen(false)}
                                  className={cn(
                                    "block rounded-2xl px-3 py-2.5 transition",
                                    "hover:bg-white hover:shadow-sm",
                                  )}
                                >
                                  <p className="text-sm font-medium text-[var(--foreground)]">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                                    {item.snippet}
                                  </p>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </PanelScrollList>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
