"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Sidebar() {
  const { view, setView } = useView();
  const { t } = useLanguage();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-neon-purple/20 bg-background-elevated/70 px-4 py-6 md:flex">
      <div className="flex flex-col gap-8">
        <button
          type="button"
          onClick={() => setView("home")}
          className="flex items-center px-2"
        >
          <span className="bg-gradient-to-l from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-xl font-bold tracking-tight text-transparent">
            radiofaaz
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
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-neon-cyan aria-[current=page]:text-[rgb(var(--accent-from-rgb))]"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
