"use client";

import { useLanguage } from "../../context/LanguageContext";

// Rendered inside the fixed top-right group alongside LanguageSwitcher (see
// layout.tsx) — same floating-pill treatment, same fixed wrapper owns the
// positioning. No PWA install prompt wired up yet (that needs capturing the
// browser's `beforeinstallprompt` event and calling `.prompt()` on it) —
// this is a placeholder control for now, hence the no-op onClick.
export default function InstallAppButton() {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => {}}
      aria-label={t("nav.installApp")}
      className="flex h-11 items-center justify-center gap-2 rounded-full border border-[rgb(var(--accent-from-rgb)/20%)] bg-background-elevated/80 px-3 text-xs font-semibold text-foreground/80 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:text-[rgb(var(--accent-text-rgb))]"
    >
      <DownloadIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{t("nav.installApp")}</span>
    </button>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}
