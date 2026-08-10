"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";

interface PlayButtonProps {
  className: string;
  iconClassName: string;
  // Compact contexts (e.g. the mini-player) render icon-only — the hero's
  // text label would overflow a 44px pill.
  showLabel?: boolean;
  // Set while the stream is known to be offline — blocks the click (on top
  // of PlayerContext's own togglePlay guard) and visually communicates
  // there's nothing to attempt playback against right now.
  disabled?: boolean;
}

export default function PlayButton({ className, iconClassName, showLabel = true, disabled = false }: PlayButtonProps) {
  const { isPlaying, isLoading, togglePlay } = usePlayer();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  const label = isLoading
    ? t("player.statusLoading")
    : isPlaying
      ? t("home.ctaPause")
      : t("home.ctaListenLive");
  const accessibleLabel = disabled ? `${label} — ${t("player.offlineMessage")}` : label;

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : togglePlay}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      aria-label={showLabel ? undefined : accessibleLabel}
      title={disabled ? t("player.offlineMessage") : undefined}
      className={`relative flex shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/25 text-[rgb(var(--accent-on-rgb))] shadow-[0_10px_32px_-8px_rgb(var(--accent-from-rgb)/60%),inset_0_1px_0_0_rgba(255,255,255,0.4),inset_0_-6px_10px_-8px_rgba(0,0,0,0.35)] ${disabled ? "cursor-not-allowed opacity-50 grayscale" : ""} ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgb(var(--accent-from-rgb)), rgb(var(--accent-to-rgb)))",
      }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-black/10" />

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="loading"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className={`relative animate-spin rounded-full border-2 border-[rgb(var(--accent-on-rgb))]/70 border-t-transparent ${iconClassName}`}
          />
        ) : isPlaying ? (
          <motion.span
            key="pause"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="relative flex"
          >
            <PauseIcon className={iconClassName} />
          </motion.span>
        ) : (
          <motion.span
            key="play"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7, rotate: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.7, rotate: -20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="relative flex"
          >
            <PlayIcon className={iconClassName} />
          </motion.span>
        )}
      </AnimatePresence>

      {showLabel && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="relative whitespace-nowrap font-semibold"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.button>
  );
}

function PlayIcon({ className }: { className: string }) {
  return (
    <svg className={`translate-x-0.5 ${className}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
