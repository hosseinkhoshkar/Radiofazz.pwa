"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";

export default function BottomNav() {
  const { view, setView } = useView();
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-neon-purple/20 bg-background-elevated/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      {navItems.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => setView(item.view)}
          aria-current={view === item.view ? "page" : undefined}
          className="flex min-w-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-foreground/60 transition-colors aria-[current=page]:text-[rgb(var(--accent-from-rgb))]"
        >
          <item.icon className="h-5 w-5" />
          {t(item.labelKey)}
        </button>
      ))}
    </nav>
  );
}
