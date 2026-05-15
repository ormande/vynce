const STORAGE_KEY = "vynce.notifications.badgeDismissed";

export function isNotificationBadgeDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function dismissNotificationBadge(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
}
