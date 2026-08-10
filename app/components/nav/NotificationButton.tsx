"use client";

import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationsContext";

const VARIANT_CLASS = {
  // Matches the nav-item buttons in Sidebar.tsx.
  sidebar:
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-foreground/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition-colors hover:bg-foreground/5 hover:text-[rgb(var(--accent-text-rgb))] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground/70",
  // Matches the menu-row buttons in MobileMenu.tsx (LanguageMenuItem trigger).
  menu: "flex min-h-10 w-full items-center gap-3 rounded-2xl px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-50 disabled:hover:bg-transparent",
} as const;

// Rendered in both Sidebar (desktop) and MobileMenu (hamburger drawer) — see
// NotificationsContext for the shared OneSignal init/state this reads.
// Returns null when the browser has no Notification API at all (e.g. iOS
// Safari outside an installed PWA) rather than showing a dead button.
export default function NotificationButton({ variant }: { variant: "sidebar" | "menu" }) {
  const { t } = useLanguage();
  const { status, requestPermission } = useNotifications();

  if (status === "unsupported") return null;

  const label =
    status === "granted"
      ? t("nav.notificationsEnabled")
      : status === "denied"
        ? t("nav.notificationsBlocked")
        : t("nav.notificationsEnable");

  return (
    <button
      type="button"
      onClick={requestPermission}
      disabled={status === "granted" || status === "denied"}
      className={VARIANT_CLASS[variant]}
    >
      <BellIcon className="h-5 w-5 shrink-0" />
      {label}
    </button>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
