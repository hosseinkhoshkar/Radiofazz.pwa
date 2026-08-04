"use client";

import { useLanguage } from "../../context/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

const LANGS: { code: Lang; label: string }[] = [
  { code: "fa", label: "FA" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("nav.languageLabel")}
      className="flex items-center justify-between gap-1 rounded-full border border-neon-purple/20 bg-background/60 p-1"
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-current={lang === code ? "true" : undefined}
          className="min-h-11 flex-1 rounded-full px-2 py-2 text-xs font-medium text-foreground/60 transition-colors aria-[current=true]:bg-neon-purple/20 aria-[current=true]:text-neon-cyan"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
