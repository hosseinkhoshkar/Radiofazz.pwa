"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";
import PlayButton from "./PlayButton";
import HomeWaveform from "./HomeWaveform";

// Persistently visible on every view, including Home — it and the hero's
// own PlayButton both read/drive the same PlayerContext singleton, so they
// never need to be reconciled: they're already always in sync.
//
// Unlike the Home hero's intentionally minimal single play/stop button, this
// bar carries the fuller reference control set (shuffle/rewind/forward are
// decorative-only — there's no seekable/shuffleable position on a
// continuous live stream — real mute toggle, and a "Full Player" shortcut
// back to the hero). See docs/nova-theme-spec.md §4 for both are documented
// as deliberately different from one another.
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
      className="fixed inset-x-4 bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] z-50 h-20 overflow-hidden rounded-3xl border border-[rgb(var(--accent-from-rgb)/25%)] bg-background-elevated/90 shadow-[0_0_0_1px_rgb(var(--accent-from-rgb)/15%),0_8px_40px_-4px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:bottom-4"
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

        {/* Center zone: shuffle / rewind / play / forward / mute */}
        <div className="flex items-center justify-self-center gap-2 sm:gap-3">
          <InertControlButton icon={ShuffleIcon} label={t("player.notAvailableLive")} />
          <InertControlButton icon={RewindIcon} label={t("player.notAvailableLive")} />

          <PlayButton className="h-12 w-12" iconClassName="h-5 w-5" showLabel={false} />

          <InertControlButton icon={ForwardIcon} label={t("player.notAvailableLive")} />

          <MuteButton />
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

function InertControlButton({
  icon: Icon,
  label,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      title={label}
      className="hidden h-8 w-8 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-foreground/60 opacity-40 sm:flex"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MuteButton() {
  const { isMuted, toggleMute } = usePlayer();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={isMuted ? t("player.unmute") : t("player.mute")}
      className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-[rgb(var(--accent-from-rgb))] sm:flex"
    >
      {isMuted ? <MutedIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
    </button>
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
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-[rgb(var(--accent-from-rgb)/50%)] hover:text-[rgb(var(--accent-from-rgb))] sm:px-3"
    >
      <ExpandIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{t("player.fullPlayer")}</span>
    </button>
  );
}

function ShuffleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h3.5a4 4 0 0 1 3.2 1.6L15 18a4 4 0 0 0 3.2 1.6H21" />
      <path d="M3 18h3.5a4 4 0 0 0 3.2-1.6l.7-1" />
      <path d="M14.3 7.6a4 4 0 0 1 3.2-1.6H21" />
      <path d="m18 3 3 3-3 3" />
      <path d="m18 15 3 3-3 3" />
    </svg>
  );
}

function RewindIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <text x="12.5" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">
        10
      </text>
    </svg>
  );
}

function ForwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v4h-4" />
      <text x="11.5" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">
        10
      </text>
    </svg>
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
