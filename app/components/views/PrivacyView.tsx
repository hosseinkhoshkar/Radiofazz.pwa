"use client";

import { useLanguage } from "../../context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const SECTIONS: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "privacy.dataCollected.title", bodyKey: "privacy.dataCollected.body" },
  { titleKey: "privacy.why.title", bodyKey: "privacy.why.body" },
  { titleKey: "privacy.retention.title", bodyKey: "privacy.retention.body" },
  { titleKey: "privacy.thirdParties.title", bodyKey: "privacy.thirdParties.body" },
  { titleKey: "privacy.caching.title", bodyKey: "privacy.caching.body" },
];

// Not in navItems.tsx on purpose — reached only via the small footer link in
// Sidebar/MobileMenu (see PrivacyPolicyLink.tsx) and the Contact form/consent
// banner links, not the primary nav or the swipe/scroll view order. page.tsx
// also explicitly disables the wheel/swipe nav handlers while this view is
// active, so scrolling here never fights view-navigation.
// Same centered shell every other view uses (AboutView, ContactView, ...),
// except this outer container itself is the scroll owner at md+ (five real
// paragraphs is more than this layout's clamp()-shrink approach can honestly
// fit in every short desktop viewport) — same pattern MobileMenu's own nav
// list already uses for a shorter list. Scrolling here happens on the
// FULL-WIDTH container (not a narrow inner column) so the native scrollbar
// sits flush against the true right edge of the viewport, same as an
// ordinary page scrollbar, while the content column itself is centered
// inside it via items-center. Bounding this box with h-full (not an
// arbitrary fixed max-height like the old max-h-[38rem]) is what actually
// keeps it clear of the mini-player: h-full always matches whatever space
// page.tsx's shared pb-[var(--mini-player-height)] has already reserved on
// every breakpoint, so the box's own bottom edge — and thus the last card
// once scrolled into view — never reaches behind the bar; a fixed rem value
// could exceed that reserved space on short viewports and did.
export default function PrivacyView() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center overflow-visible px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.5vh,2rem)] md:h-full md:overflow-y-auto">
      <div className="flex w-full max-w-2xl flex-col gap-[clamp(0.6rem,1.6vh,1rem)]">
        <div className="w-full shrink-0 text-center">
          <h1 className="text-[clamp(1.4rem,2.8vw,1.95rem)] font-bold text-foreground">
            {t("privacy.title")}
          </h1>
          <p className="mx-auto mt-2 w-full max-w-lg text-[clamp(0.78rem,1.6vw,0.91rem)] leading-snug text-muted">
            {t("privacy.intro")}
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div
            key={section.titleKey}
            className="shrink-0 rounded-2xl border border-foreground/10 bg-background-elevated/60 px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.55rem,1.3vh,0.85rem)] backdrop-blur-xl"
          >
            <h2 className="text-[clamp(0.85rem,1.5vw,0.98rem)] font-semibold text-[rgb(var(--accent-text-rgb))]">
              {t(section.titleKey)}
            </h2>
            <p className="mt-1 text-[clamp(0.73rem,1.35vw,0.86rem)] leading-snug text-muted">
              {t(section.bodyKey)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
