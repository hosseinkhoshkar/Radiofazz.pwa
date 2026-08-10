"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";

// Brief, non-intrusive notice for a mid-playback drop (as opposed to the
// hero/mini-player's own "offline" states, which cover the stream being
// down before playback ever started) — the user was actively listening and
// the connection was lost underneath them, so this surfaces above the
// mini-player rather than silently leaving them thinking it's just paused.
// Floats above the mini-player (same z-tier ordering as the rest of the
// fixed UI: below the drawer/backdrop, above ordinary page content) and
// disappears on its own once retryPlayback() succeeds (PlayerContext clears
// streamInterrupted on the next "playing" event) or via the close button.
export default function StreamStatusToast() {
  const { streamInterrupted, retryPlayback, dismissStreamInterrupted } = usePlayer();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden={!streamInterrupted}
      className="pointer-events-none fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[55] flex justify-center md:bottom-[6.5rem]"
    >
      <AnimatePresence>
        {streamInterrupted && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-danger/40 bg-background-elevated/90 px-4 py-3 text-sm text-foreground shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          >
            <span className="min-w-0 flex-1">{t("player.streamInterrupted")}</span>

            <button
              type="button"
              onClick={retryPlayback}
              className="shrink-0 rounded-full border border-[rgb(var(--accent-from-rgb)/50%)] bg-[rgb(var(--accent-from-rgb)/15%)] px-3 py-1 text-sm font-semibold text-[rgb(var(--accent-text-rgb))] transition-colors hover:bg-[rgb(var(--accent-from-rgb)/25%)]"
            >
              {t("player.retryPlayback")}
            </button>

            <button
              type="button"
              onClick={dismissStreamInterrupted}
              aria-label={t("player.dismiss")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:text-foreground"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
