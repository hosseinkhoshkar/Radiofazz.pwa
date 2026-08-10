"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";
import { socialLinks } from "./socialLinks";
import SocialIcon from "./SocialIcon";
import Logo from "./Logo";
import NotificationButton from "./NotificationButton";

export default function Sidebar() {
  const { view, setView } = useView();
  const { t } = useLanguage();

  return (
    <aside
      // The mini-player now spans full width over the sidebar at a higher
      // z-index (see MiniPlayer.tsx) — reserve the same clearance at the
      // bottom here so the social icons row never ends up visually covered
      // by it. (The language switcher used to live here too — it's now a
      // fixed top-right element, see LanguageSwitcher.tsx.)
      //
      // No background color at all — fully transparent so the hero photo/
      // ambient effects show through behind the nav. backdrop-blur-sm is
      // legibility-only (softens whatever's behind, no tint/color of its
      // own), and drop-shadow-[...] on the text/icon content below does the
      // rest of the contrast work, rather than a solid/tinted panel.
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-[rgb(var(--accent-from-rgb)/20%)] px-4 pt-10 pb-[calc(1.5rem+var(--mini-player-height))] backdrop-blur-sm lg:flex"
    >
      <div className="flex flex-col gap-24">
        <button
          type="button"
          onClick={() => setView("home")}
          className="flex px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
        >
          {/* text-3xl wrapped the LIVE tag onto its own line in this 240px
              sidebar (w-60, minus px-4 + button's own px-2) — 27px is the
              largest size that still measured out to fit both on one line,
              bigger than the earlier text-2xl baseline. */}
          <Logo textClassName="text-[30px]" />
        </button>

        <nav>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.view}>
                <button
                  type="button"
                  onClick={() => setView(item.view)}
                  aria-current={view === item.view ? "page" : undefined}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-foreground/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition-colors hover:bg-foreground/5 hover:text-[rgb(var(--accent-text-rgb))] aria-[current=page]:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:text-white aria-[current=page]:hover:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:hover:text-white"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
            <li>
              <NotificationButton variant="sidebar" />
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-1 px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
        {socialLinks.map((link) => (
          <SocialIcon key={link.labelKey} {...link} />
        ))}
      </div>
    </aside>
  );
}
