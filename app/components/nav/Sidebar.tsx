"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";
import { socialLinks } from "./socialLinks";
import SocialIcon from "./SocialIcon";

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
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-neon-purple/20 bg-background-elevated/70 px-4 pt-6 pb-[calc(1.5rem+var(--mini-player-height))] md:flex"
    >
      <div className="flex flex-col gap-14">
        <button
          type="button"
          onClick={() => setView("home")}
          className="flex items-center gap-2 px-2"
        >
          <span className="logo-shine text-xl font-bold tracking-tight uppercase">
            RADIO FAAZ
          </span>
          <span className="shrink-0 rounded border border-danger/30 bg-danger/15 px-1 text-[10px] font-bold uppercase tracking-wide text-danger">
            LIVE
          </span>
        </button>

        <nav>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.view}>
                <button
                  type="button"
                  onClick={() => setView(item.view)}
                  aria-current={view === item.view ? "page" : undefined}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-neon-cyan aria-[current=page]:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:text-white aria-[current=page]:hover:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:hover:text-white"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-1 px-1">
        {socialLinks.map((link) => (
          <SocialIcon key={link.labelKey} {...link} />
        ))}
      </div>
    </aside>
  );
}
