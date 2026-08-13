"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";
import { useConsent } from "../context/ConsentContext";

// One-time, honest notice — this site has no tracking cookies or
// third-party ads to gate behind a heavy preference manager, just the
// local storage (language) and optional push subscription (OneSignal)
// covered in the Privacy Policy, so a single dismissible bar is enough.
// Floats at the TOP rather than joining the bottom stack (MiniPlayer +
// StreamStatusToast are both already fixed at the bottom) so it can never
// overlap either of those, first-visit or not. Centered with side insets,
// same pattern as StreamStatusToast, which keeps it clear of the
// top-right Install/Language group and the mobile hamburger in both
// corners without needing to coordinate positioning with either.
// The accept button is also the sole trigger that lets GoogleAnalytics.tsx
// load anything — see ConsentContext.tsx, which now owns the underlying
// localStorage flag this banner used to keep entirely to itself.
export default function ConsentBanner() {
  const { setView } = useView();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const { hasConsented, grantConsent } = useConsent();
  const dismissed = hasConsented;

  return (
    <div
      aria-hidden={dismissed}
      // top-20 (clears the mobile hamburger trigger, fixed top-4 + its own
      // 44px height) below lg; lg+ has no hamburger (Sidebar instead, which
      // doesn't occupy the top area) so top-4 is safe there, same as
      // StreamStatusToast's bottom equivalent.
      className="pointer-events-none fixed inset-x-4 top-20 z-[56] flex justify-center lg:top-4"
    >
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            role="status"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[rgb(var(--accent-from-rgb)/30%)] bg-background-elevated/90 px-4 py-3 text-sm text-foreground shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:max-w-lg"
          >
            <span className="min-w-0 flex-1 text-[0.83rem] leading-snug text-foreground/85">
              {t("consent.messageBefore")}
              <button
                type="button"
                onClick={() => setView("privacy")}
                className="font-medium text-[rgb(var(--accent-text-rgb))] underline underline-offset-2 hover:opacity-80"
              >
                {t("nav.privacyPolicy")}
              </button>
              {t("consent.messageAfter")}
            </span>

            <button
              type="button"
              onClick={grantConsent}
              className="shrink-0 rounded-full border border-[rgb(var(--accent-from-rgb)/50%)] bg-[rgb(var(--accent-from-rgb)/15%)] px-3 py-1.5 text-sm font-semibold text-[rgb(var(--accent-text-rgb))] transition-colors hover:bg-[rgb(var(--accent-from-rgb)/25%)]"
            >
              {t("consent.accept")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
