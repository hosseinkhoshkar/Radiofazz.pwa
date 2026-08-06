"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";
import { useFinePointer } from "@/lib/useFinePointer";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";
import { DEFAULT_COVER_ART } from "@/lib/itunes";
import PlayButton from "./PlayButton";
import HomeWaveform from "./HomeWaveform";
import MarqueeText from "./MarqueeText";

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
// it still visually sits on top of it. Mobile has no bottom tab bar to float
// above anymore (see MobileMenu.tsx) — it docks near the viewport edge with
// just its own margin, plus env(safe-area-inset-bottom) added on top (not
// replacing it) for devices with a home-indicator inset.
//
// The accent-tinted border/glow (same --accent-from-rgb var as everything
// else, so it crossfades with the palette automatically, ad mode included)
// plus the omnidirectional drop shadow and glass blur are what make it read
// as a distinct floating panel rather than blending into the page.
//
// Content uses a 3-column `1fr auto 1fr` grid on desktop (not a single flex
// row) so the center control cluster is always mathematically centered in
// the bar's full width, regardless of how much space the left/right zones'
// content actually uses.
//
// Mobile drops to a genuinely different 2-column grid instead, gated on
// useIsMobileViewport (JS, not a CSS breakpoint) — verified via live
// computed-style inspection that `display:none`-ing the desktop center
// column (Tailwind `hidden md:flex`) does NOT reliably collapse an `auto`
// grid track to 0 width in this browser: with that item hidden, the track
// still measured 92px in the real rendered DOM, silently eating space that
// should've gone to the left/right zones and pushing Play off-center. Two
// earlier fix attempts (reordering with `order-*`, then moving Play into
// the right zone while leaving the 3-column grid's phantom middle track
// intact) both failed for this same underlying reason. Actually removing
// the middle grid track from the template on mobile — not just hiding its
// content — is what makes this reliable.
export default function MiniPlayer() {
  const { artist, track, coverArt } = usePlayer();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobileViewport();
  // No API-found art for this track — collapse the thumbnail's own width
  // (and its spacing) to 0 instead of just showing a placeholder image, so
  // the title/artist column expands to fill the freed space. Same 400ms
  // timing as the hero's own cover-art crossfade (see HomeHero.tsx).
  const hasCoverArt = coverArt !== DEFAULT_COVER_ART;
  const collapseDurationClass = prefersReducedMotion ? "duration-0" : "duration-[400ms]";

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      // No overflow-hidden here — the volume popup expands as an absolute
      // overlay outside this bar's own box, and an overflow-hidden ancestor
      // would clip it away entirely. Nothing else here relies on the bar's
      // own clip (the thumbnail has its own local overflow-hidden
      // rounded-full), so dropping it is safe.
      //
      // Mobile bottom offset: docks directly near the viewport edge now
      // (1rem margin + safe-area-inset-bottom) — the old bottom tab bar
      // this used to float above (+4rem reservation) is gone, replaced by
      // MobileMenu's hamburger overlay. md:bottom-4 (desktop) unchanged.
      // Border/shadow bumped from a faint edge separator to a visible
      // palette-colored halo around the whole bar's perimeter, and the
      // surface dropped from bg-*/90 to /65 + backdrop-blur-2xl to
      // backdrop-blur-3xl — reads as clearly glassy/translucent now
      // instead of a near-opaque flat panel.
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 h-20 rounded-3xl border border-[rgb(var(--accent-from-rgb)/60%)] bg-background-elevated/65 shadow-[0_0_0_1px_rgb(var(--accent-from-rgb)/30%),0_0_36px_-4px_rgb(var(--accent-from-rgb)/70%),0_0_64px_-8px_rgb(var(--accent-to-rgb)/50%),0_8px_40px_-4px_rgba(0,0,0,0.7)] backdrop-blur-3xl md:bottom-4"
    >
      <div
        className={`grid h-full w-full items-center gap-2 px-3 sm:gap-4 sm:px-4 ${
          isMobile ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto_1fr]"
        }`}
      >
        {/* Left zone: thumbnail + title/artist. No justify-self-start here
            (would opt this grid item out of the column's default stretch,
            which makes the browser size it to its own max-content width
            instead — and a flex child's min-w-0 only bounds its MINIMUM
            size, not its max-content contribution, so a long nowrap title
            inside would still inflate this whole zone past the bar's own
            edge and visually run under the play button. Left-alignment is
            already the natural result of stretch + this row's own
            justify-content default (flex-start), so nothing is lost by
            leaving it out.) */}
        <div className="flex min-w-0 items-center">
          <div
            className={`h-11 shrink-0 overflow-hidden rounded-full transition-[width,margin-right] ${collapseDurationClass} ease-out ${
              hasCoverArt ? "w-11 mr-2 sm:mr-3" : "w-0 mr-0"
            }`}
          >
            <img src={coverArt} alt="" className="h-full w-full object-cover" />
          </div>

          {/* Same overflow-detection + scroll-on-demand marquee the hero's
              track title uses (see MarqueeText) — a long title/artist used
              to just truncate=false render past its own box and visually
              run underneath the play button next to it; this measures
              against the actual available width (this min-w-0 flex-1
              column, which stops short of Play/Volume) and only scrolls
              when the text truly doesn't fit. */}
          <div className="min-w-0 flex-1">
            <MarqueeText text={track} className="text-base font-medium text-foreground" />
            <MarqueeText text={artist} className="text-sm text-muted" />
          </div>
        </div>

        {/* Center zone: play / volume, mathematically centered via this
            dedicated middle grid column + justify-self-center. Desktop
            only — on mobile this whole grid item is omitted from the tree
            (not just hidden), so there's no middle track at all to fix in
            place, matching the 2-column grid-cols-[1fr_auto] chosen above. */}
        {!isMobile && (
          <div className="flex items-center gap-3 justify-self-center">
            <PlayButton className="h-12 w-12" iconClassName="h-5 w-5" showLabel={false} />
            <VolumeControl />
          </div>
        )}

        {/* Right zone: waveform + LIVE badge + Full Player, then (mobile
            only) volume + play flush at the bar's true right edge — Play is
            the LAST flex child here with nothing after it, so its own right
            edge sits directly against the zone's edge, which is itself
            pinned to the bar's right inner edge via justify-self-end on
            this whole zone (now the grid's 2nd/last column on mobile, since
            the middle column doesn't exist there). FullPlayerButton stays
            put rather than also fighting for the literal edge position —
            the task only asked to move Play/Volume. */}
        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <div className="w-20">
              <HomeWaveform heightClassName="h-4" barCountDesktop={20} barCountMobile={14} />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-danger">
              • {t("home.statsLiveLabel")}
            </span>
          </div>

          <FullPlayerButton />

          <div className="flex items-center gap-2 md:hidden">
            <VolumeControl />
            <PlayButton className="h-12 w-12" iconClassName="h-5 w-5" showLabel={false} />
          </div>
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

      {/* Absolute overlay, vertically centered (top-1/2 -translate-y-1/2) —
          not above the icon. Expand direction is breakpoint-aware: on
          mobile the volume icon now sits LEFT of the play button (order-1
          above), so expanding rightward (the desktop direction) would grow
          the panel straight into/under the play button — mobile expands
          left instead (right-full mr-2), md: restores the original
          right-of-icon direction (left-full ml-2, right-auto). width/
          opacity/border animate together (transition-all) so it grows from
          a sliver into a proper rounded pill rather than an abrupt pop, but
          it never occupies space in the center zone's flex flow —
          collapsed or expanded, siblings don't move. Collapsed state keeps
          the border transparent — a bordered 0-width box would still leave
          a faint 1px seam where its corners meet — and pointer-events-none
          so it can't intercept clicks while invisible. */}
      <div
        className={`absolute top-1/2 right-full z-10 mr-2 flex -translate-y-1/2 items-center overflow-hidden rounded-full border bg-background-elevated/80 shadow-lg backdrop-blur-xl md:right-auto md:left-full md:mr-0 md:ml-2 ${
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
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-[rgb(var(--accent-from-rgb)/50%)] hover:text-[rgb(var(--accent-text-rgb))] sm:px-3"
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
