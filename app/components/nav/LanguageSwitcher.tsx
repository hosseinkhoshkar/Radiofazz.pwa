"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

const LANGS: { code: Lang; nativeName: string }[] = [
  { code: "en", nativeName: "English" },
  { code: "fa", nativeName: "فارسی" },
  { code: "de", nativeName: "Deutsch" },
];

// Rendered inside the fixed top-right group alongside InstallAppButton (see
// layout.tsx) — that shared wrapper owns the fixed positioning/z-index now,
// this is just a `relative` item within it so its own dropdown's
// `absolute top-full right-0` still anchors correctly.
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.languageLabel")}
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-[rgb(var(--accent-from-rgb)/20%)] bg-background-elevated/80 px-3 text-xs font-semibold text-foreground/80 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:text-[rgb(var(--accent-text-rgb))]"
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="text-foreground">{lang.toUpperCase()}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("nav.languageLabel")}
          className="absolute top-full right-0 z-[60] mt-2 w-full min-w-[10rem] overflow-hidden rounded-xl border border-[rgb(var(--accent-from-rgb)/20%)] bg-background-elevated/95 py-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {LANGS.map(({ code, nativeName }) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={lang === code}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-[rgb(var(--accent-text-rgb))]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{code.toUpperCase()}</span>
                  {nativeName}
                </span>
                {lang === code && <CheckIcon className="h-4 w-4 text-[rgb(var(--accent-text-rgb))]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
