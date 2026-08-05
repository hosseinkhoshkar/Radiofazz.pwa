"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";
import { useFinePointer } from "@/lib/useFinePointer";
import PlayButton from "./PlayButton";
import HomeWaveform from "./HomeWaveform";

// Persistently visible on every view, including Home — it and the hero's
// own PlayButton both read/drive the same PlayerContext singleton, so they
// never need to be reconciled: they're already always in sync.
//
// Unlike the Home hero's intentionally minimal single play/stop button, this
// bar carries the fuller reference control set: a real volume control (a
// glassmorphic horizontal slider that overlays above the icon on
// hover/tap — see VolumeControl below — without shifting any of this bar's
// other content, plus a quick mute toggle on the icon itself) and a
// "Full Player" shortcut back to the hero. The previous shuffle/rewind-10/
// forward-10 decorative icons are gone entirely — there's no seekable or
// shuffleable position on a continuous live stream, so they never did
// anything and were removed rather than kept as inert placeholders.
//
// A floating rounded panel (not flush against any edge anymore): margins on
// the bottom/left/right so all four corners are genuinely visible, spanning
// the full viewport width (including over the sidebar's column on desktop)
// minus that margin, at a higher z-index than the sidebar (z-50 > z-40) so
// it still visually sits on top of it. On mobile it floats above the bottom
// tab bar with its own gap on top of that bar's height, plus
// env(safe-area-inset-bottom) added on top of the margin (not replacing it)
// for devices with a home-indicator inset.
//
// The accent-tinted border/glow (same --accent-from-rgb var as everything
// else, so it crossfades with the palette automatically, ad mode included)
// plus the omnidirectional drop shadow and glass blur are what make it read
// as a distinct floating panel rather than blending into the page.
//
// Content uses a 3-column `1fr auto 1fr` grid (not a single flex row) so the
// center control cluster is always mathematically centered in the bar's
// full width, regardless of how much space the left/right zones' content
// actually uses — a plain flex row would leave the controls stranded
// wherever the left zone's flex-1 happened to push them.
export default function MiniPlayer() {
  const { artist, track, coverArt } = usePlayer();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      // No overflow-hidden here (used to be) — the volume popup below is
      // `absolute bottom-full`, floating above this bar's own box, and an
      // overflow-hidden ancestor was silently clipping it away entirely:
      // the slider was correctly wired to audio.volume the whole time, it
      // was just invisible/unreachable. Nothing else here relies on the
      // bar's own clip (the thumbnail has its own local overflow-hidden
      // rounded-full), so dropping it is safe.
      className="fixed inset-x-4 bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] z-50 h-20 rounded-3xl border border-[rgb(var(--accent-from-rgb)/25%)] bg-background-elevated/90 shadow-[0_0_0_1px_rgb(var(--accent-from-rgb)/15%),0_8px_40px_-4px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:bottom-4"
    >
      <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Left zone: thumbnail + title/artist */}
        <div className="flex min-w-0 items-center justify-self-start gap-2 sm:gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <img src={coverArt} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{track}</p>
            <p className="truncate text-xs text-muted">{artist}</p>
          </div>
        </div>

        {/* Center zone: play / volume */}
        <div className="flex items-center justify-self-center gap-2 sm:gap-3">
          <PlayButton className="h-12 w-12" iconClassName="h-5 w-5" showLabel={false} />

          <VolumeControl />
        </div>

        {/* Right zone: waveform + LIVE badge + Full Player */}
        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <div className="w-20">
              <HomeWaveform heightClassName="h-4" barCountDesktop={20} barCountMobile={14} />
            </div>
            <span className="text-[10px] font-bold tracking-wide text-danger">
              • {t("home.statsLiveLabel")}
            </span>
          </div>

          <FullPlayerButton />
        </div>
      </div>
    </motion.div>
  );
}

// A real volume control: the icon is still a quick mute toggle (a plain
// click, independent of the panel now), and a glassmorphic horizontal
// slider reveals next to it — via hover on devices with a real mouse
// ((hover: hover) and (pointer: fine), same gate the cursor-driven ambient
// effects use elsewhere), via tap-to-toggle on touch devices where hover
// doesn't exist. The panel is an absolute overlay, not an inline element
// that grows the layout — it floats above the icon and never shifts the
// play button, waveform, LIVE badge, or Full Player button next to it,
// expanding or collapsed.
function VolumeControl() {
  const { isMuted, toggleMute, volume, setVolume } = usePlayer();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const isFinePointer = useFinePointer();
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

  const isEffectivelyMuted = isMuted || volume === 0;

  return (
    <div
      ref={rootRef}
      className="relative flex shrink-0 items-center"
      onMouseEnter={isFinePointer ? () => setOpen(true) : undefined}
      onMouseLeave={isFinePointer ? () => setOpen(false) : undefined}
    >
      <button
        type="button"
        onClick={toggleMute}
        onTouchEnd={
          isFinePointer
            ? undefined
            : (event) => {
                // No hover on touch — tap toggles the panel instead.
                // preventDefault suppresses the synthetic click that would
                // otherwise also fire toggleMute right after.
                event.preventDefault();
                setOpen((prev) => !prev);
              }
        }
        aria-label={isMuted ? t("player.unmute") : t("player.mute")}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-[rgb(var(--accent-text-rgb))]"
      >
        {isEffectivelyMuted ? <MutedIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
      </button>

      {/* Absolute overlay: width/opacity/border animate together
          (transition-all) so it grows from a sliver into a proper rounded
          pill rather than an abrupt pop, but it never occupies space in the
          center zone's flex flow — collapsed or expanded, siblings don't
          move. Collapsed state keeps the border transparent — a bordered
          0-width box would still leave a faint 1px seam where its corners
          meet — and pointer-events-none so it can't intercept clicks while
          invisible. */}
      <div
        className={`absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 items-center overflow-hidden rounded-full border bg-background-elevated/80 shadow-lg backdrop-blur-xl ${
          prefersReducedMotion ? "" : "transition-all duration-300 ease-out"
        } ${
          open
            ? "w-20 border-white/10 px-3 py-2 opacity-100"
            : "pointer-events-none w-0 border-transparent px-0 py-2 opacity-0"
        }`}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={isMuted ? 0 : Math.round(volume * 100)}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          aria-label={t("player.volumeLabel")}
          tabIndex={open ? 0 : -1}
          className="h-1.5 w-14 cursor-pointer rounded-full accent-[rgb(var(--accent-from-rgb))]"
        />
      </div>
    </div>
  );
}

function FullPlayerButton() {
  const { view, setView } = useView();
  const { t } = useLanguage();

  if (view === "home") return null;

  return (
    <button
      type="button"
      onClick={() => setView("home")}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-[rgb(var(--accent-from-rgb)/50%)] hover:text-[rgb(var(--accent-text-rgb))] sm:px-3"
    >
      <ExpandIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{t("player.fullPlayer")}</span>
    </button>
  );
}

function ExpandIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function VolumeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function MutedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m17 9 5 6M22 9l-5 6" />
    </svg>
  );
}
