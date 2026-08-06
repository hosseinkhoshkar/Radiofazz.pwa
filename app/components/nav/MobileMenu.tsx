"use client";

import { useEffect, useState } from "react";
import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";
import { navItems } from "./navItems";
import { socialLinks } from "./socialLinks";
import SocialIcon from "./SocialIcon";
import Logo from "./Logo";
import type { Lang } from "@/lib/i18n/translations";

const LANGS: { code: Lang; nativeName: string }[] = [
  { code: "en", nativeName: "English" },
  { code: "fa", nativeName: "فارسی" },
  { code: "de", nativeName: "Deutsch" },
];

// Mobile-only replacement for the old bottom tab bar: a hamburger trigger
// (top-left) opening a slide-in drawer with everything the desktop sidebar
// carries — nav items, logo + LIVE tag, social icons — plus the language
// picker, which no longer floats top-right on mobile (see layout.tsx) and
// isn't the same floating-pill LanguageSwitcher component used there either
// — here it's styled as a regular menu row that expands inline in place,
// since a nested dropdown-within-a-drawer reads worse than a drawer-native
// expand/collapse row. lg:hidden throughout — covers phone AND tablet
// widths now (was md:hidden, phone-only); only >=1024px desktop keeps the
// fixed Sidebar + LanguageSwitcher, completely unaffected by anything in
// this file. Drawer width/bg step up at md: (768-1024, tablet) to their
// own values, independent of the phone-tier (<768) ones on the base class.
export default function MobileMenu() {
  const { view, setView } = useView();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.openMenu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed top-4 left-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--accent-from-rgb)/25%)] bg-background-elevated/55 text-foreground/80 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors hover:text-[rgb(var(--accent-text-rgb))] lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Backdrop over the ~20% of viewport the drawer doesn't cover —
              tapping it closes the menu, same as the close button. z-[65]:
              above everything except the drawer itself. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[65] bg-black/20 lg:hidden"
          />

          {/* Slide-in drawer from the left (same side as the hamburger
              trigger, matching where the desktop sidebar lives) — 60% of
              viewport width (revised up from an earlier 50%; also happens
              to be enough room for all 4 social icons to sit on one line
              instead of wrapping — see the social row below), capped so it
              doesn't get absurdly wide on larger phones/small tablets still
              under md. z-[70] beats the mini-player (z-50), the backdrop
              (z-65), and the top-right desktop group (z-[60], hidden on
              mobile anyway), so it's always the topmost thing when open.
              bg-background/50: 50% see-through so page content shows behind
              it, backdrop-blur-2xl keeps text legible over whatever that
              is. Closing just unmounts it; nothing else needs resetting
              since every control underneath reads live shared state (view,
              language, player) rather than anything this component owns. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.openMenu")}
            className="fixed inset-y-0 left-0 z-[70] flex w-3/5 max-w-sm flex-col bg-background/50 backdrop-blur-2xl md:w-[30%] md:bg-background/50 lg:hidden"
          >
            <div className="flex shrink-0 items-center justify-between px-4 pt-4">
              {/* Shared component with Sidebar.tsx (see Logo.tsx) — the LIVE
                  tag going missing here twice before was two hand-rolled
                  copies of the same markup drifting apart; now there's only
                  one implementation for both to render. */}
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-[rgb(var(--accent-text-rgb))]"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* gap-1 (was gap-2) + each row's own min-h-10 (was min-h-14,
                text-sm): tighter list, row height still clears the ~40px
                sensible-minimum tap target even with the smaller font. */}
            <nav className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-6">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => {
                    setView(item.view);
                    setOpen(false);
                  }}
                  aria-current={view === item.view ? "page" : undefined}
                  className="flex min-h-10 w-full items-center gap-3 rounded-2xl px-4 text-sm font-medium text-foreground/80 transition-colors aria-[current=page]:bg-[rgb(var(--accent-from-rgb))] aria-[current=page]:text-white"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </button>
              ))}

              <LanguageMenuItem />
            </nav>

            <div className="flex shrink-0 flex-col items-center gap-4 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
              <div className="flex flex-wrap items-center justify-center gap-1">
                {socialLinks.map((link) => (
                  <SocialIcon key={link.labelKey} {...link} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// A regular-looking menu row (same visual treatment as the nav-item buttons
// above it), except tapping it doesn't navigate — it expands inline to show
// the three language options, and picking one applies it immediately and
// collapses the picker back. Deliberately not the floating-pill
// LanguageSwitcher component desktop uses; that reads oddly as a nested
// dropdown inside an already-open drawer.
function LanguageMenuItem() {
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setLangOpen((prev) => !prev)}
        aria-expanded={langOpen}
        className="flex min-h-10 w-full items-center gap-3 rounded-2xl px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5"
      >
        <GlobeIcon className="h-5 w-5 shrink-0" />
        {t("nav.languageLabel")}
        {/* No language-code label here anymore (was lang.toUpperCase(),
            e.g. "EN") — this collapsed row now reads as a generic
            "Language"/"زبان"/"Sprache" item like any other menu row; the
            actual EN/DE/FA codes only show once expanded below. */}
        <ChevronIcon className={`ms-auto h-4 w-4 shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} />
      </button>

      {langOpen && (
        // ps-12 (was ps-14): re-aligned to the trigger row's own icon+gap+
        // padding now that the icon shrank (h-6 -> h-5, gap-4 -> gap-3), so
        // the options still line up directly under the trigger's own label.
        <div role="listbox" aria-label={t("nav.languageLabel")} className="flex flex-col gap-1 py-1 ps-12">
          {LANGS.map(({ code, nativeName }) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={lang === code}
              onClick={() => {
                setLang(code);
                setLangOpen(false);
              }}
              className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-start text-sm text-foreground/70 transition-colors hover:bg-foreground/5 aria-[selected=true]:text-[rgb(var(--accent-text-rgb))]"
            >
              <span className="text-[0.73rem] font-semibold text-muted">{code.toUpperCase()}</span>
              {nativeName}
              {lang === code && <CheckIcon className="ms-auto h-4 w-4 text-[rgb(var(--accent-text-rgb))]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
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

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
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
