"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";

export default function MiniPlayer() {
  const { view } = useView();
  const { isPlaying, isLoading, artist, track, coverArt, togglePlay } =
    usePlayer();
  const { t, dir } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const visible = view !== "home";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          className={`fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-6 ${
            dir === "rtl"
              ? "md:left-auto md:right-[calc(50%+7.5rem)] md:translate-x-1/2"
              : "md:left-[calc(50%+7.5rem)] md:right-auto"
          }`}
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-full border border-foreground/10 bg-background-elevated/70 p-2 pe-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <img
                src={coverArt}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {track}
              </p>
              <p className="truncate text-xs text-muted">{artist}</p>
            </div>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? t("player.pause") : t("player.play")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple text-background"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-foreground/10">
              {isPlaying && prefersReducedMotion && (
                <span className="block h-full w-full bg-neon-cyan/70" />
              )}
              {isPlaying && !prefersReducedMotion && (
                <motion.span
                  className="block h-full w-1/3 bg-neon-cyan"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
              )}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
