"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";
import { socialLinks } from "./socialLinks";
import SocialIcon from "./SocialIcon";

export default function BottomNav() {
  const { view, setView } = useView();
  const { t } = useLanguage();

  return (
    // No background color — fully transparent so the hero/ambient effects
    // show through, matching the desktop sidebar. backdrop-blur-md was
    // already here (legibility-only, no tint), just dropped the bg- class.
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-[rgb(var(--accent-from-rgb)/20%)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      {navItems.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => setView(item.view)}
          aria-current={view === item.view ? "page" : undefined}
          className="mx-1 my-2 flex min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-foreground/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition-colors aria-[current=page]:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:text-white"
        >
          <item.icon className="h-5 w-5" />
          {t(item.labelKey)}
        </button>
      ))}

      {/* Secondary utility icons — fixed-width slot, deliberately without
          labels, so they read as secondary next to the 4 primary label+icon
          tabs above rather than competing with them for space. Packed at
          gap-0.5 (tighter than the sidebar's row) to leave the primary tabs
          as much room as possible on narrow phones. */}
      <div className="flex shrink-0 items-center gap-0.5 self-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
        {socialLinks.map((link) => (
          <SocialIcon key={link.labelKey} {...link} />
        ))}
      </div>
    </nav>
  );
}
