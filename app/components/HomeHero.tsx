"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { DEFAULT_COVER_ART } from "@/lib/itunes";
import PlayButton from "./PlayButton";
import HomeWaveform from "./HomeWaveform";

// Local hero background — replaced the canvas/SVG generative experiments
// (both abandoned; static photo again). Also the fallback for sponsor mode
// when an ad's own image is missing (e.g. slug not found in ads.json).
const HERO_IMAGE_URL = "/images/hero-bg.png";

const NUMBER_LOCALES: Record<string, string> = {
  en: "en-US",
  de: "de-DE",
  fa: "fa-IR",
};

export default function HomeHero() {
  const { track, artist, isPlaying, listeners, isAd, adLink, adImage, coverArt } = usePlayer();
  const { t, lang } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  const listenersCount = new Intl.NumberFormat(NUMBER_LOCALES[lang] ?? "en-US").format(listeners);

  // No API-found art for this track — hide the image (opacity, not
  // unmount/display:none) rather than fall back to the old placeholder, so
  // the reserved square keeps the text column/waveform/stats/language
  // switcher from shifting.
  const hasCoverArt = coverArt !== DEFAULT_COVER_ART;
  const heroImageSrc = isAd ? (adImage ?? HERO_IMAGE_URL) : HERO_IMAGE_URL;

  return (
    // Mobile: hard-capped h-[60dvh] (up from 50dvh) — the three-card section used to live
    // inside this same card (below the badge/title/etc, sharing one
    // rounded-3xl box) and this box's height was just flex-1 (grow to fill
    // whatever the parent had); that let it balloon arbitrarily tall
    // whenever the content block's own spacing did, which is what pushed
    // the cards down into/past the mini-player. Cards now render as
    // HomeView's own sibling below this box (see HomeView.tsx) instead of
    // inside it, and this box's own height is a real, fixed budget rather
    // than however-tall-content-makes-it. md: back to flex-1 — desktop's
    // sizing (fills available column height) is unaffected.
    // justify-end lives on the z-10 wrapper below now, not here — see that
    // element's own comment for why (content-independent positioning anchor
    // for the absolutely-positioned mobile cover art).
    <div className="relative isolate flex h-[60dvh] w-full flex-col overflow-hidden rounded-3xl border border-foreground/10 [clip-path:inset(0_round_1.5rem)] md:h-auto md:min-h-0 md:flex-1">
      <AnimatePresence mode="wait">
        <motion.img
          key={heroImageSrc}
          src={heroImageSrc}
          alt=""
          aria-hidden="true"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="absolute inset-0 h-full w-full rounded-3xl object-cover"
        />
      </AnimatePresence>

      {/* Extended down the full merged height (hero content + card row below)
          so the card row still lands on the dark, high-contrast part of the
          scrim instead of the photo's lighter top edge. Explicit z-0: keeps
          this pinned below the decorative composition and content below
          regardless of DOM order. */}
      <div className="absolute inset-0 z-0 rounded-3xl bg-gradient-to-t from-black/95 via-black/85 to-black/55" />
      {/* Palette hue tint — mix-blend-mode: color reuses the dark layer's own
          luminance, so this only shifts hue, never brightens/darkens the
          scrim under it (keeps text contrast intact). */}
      <div
        className="absolute inset-0 z-0 rounded-3xl"
        style={{
          backgroundColor: "rgb(var(--accent-from-rgb))",
          mixBlendMode: "color",
          opacity: 0.35,
        }}
      />

      {/* Ambient decorative composition — mic glyph behind the Faaz logo,
          same position, so the mic peeks through the logo PNG's transparent
          areas; both inside one glowing ring. Explicit z-[5]: above the
          background photo + gradient/tint (both z-0) so it's visibly on top
          of them, but still below the z-10 foreground content (cover art,
          title, waveform, CTA), which must stay unobstructed.
          No longer hidden on mobile — visible at every breakpoint, just
          positioned/sized differently: mobile sits top-left (left-3 top-8 —
          nudged back down slightly from an earlier top-4 that sat a bit too
          close to MobileMenu's hamburger trigger at fixed top-4 left-4;
          that trigger is `fixed`+z-[60] so it always composites above this
          regardless, this offset is purely about not visually crowding it)
          at a noticeably smaller clamp() than desktop; md: restores the
          exact original right-side position/size (-right-12 top-8,
          translate, 28rem max) unchanged. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-8 z-[5] flex flex-col items-center opacity-45 blur-[0.4px] md:left-auto md:-right-12 md:top-8 md:-translate-x-[45%]"
        style={{ mixBlendMode: "screen" }}
      >
        <div className="relative flex h-[clamp(6rem,20vh,9rem)] w-[clamp(6rem,20vh,9rem)] shrink-0 items-center justify-center rounded-full border-2 border-[rgb(var(--accent-from-rgb))] shadow-[0_0_80px_10px_rgb(var(--accent-from-rgb)/60%)] md:h-[clamp(16rem,42vh,28rem)] md:w-[clamp(16rem,42vh,28rem)]">
          <MicIcon className="absolute inset-0 m-auto h-[55%] w-[55%] text-[rgb(var(--accent-from-rgb))] drop-shadow-[0_0_24px_rgb(var(--accent-from-rgb)/80%)]" />
          <img
            src="/images/logo-faaz.png"
            alt=""
            className="absolute inset-0 m-auto h-[85%] w-[85%] rounded-full object-contain"
          />
        </div>
      </div>

      {/* Single child now (the text+cover row below) — the three-card
          section that used to be this flex-col's second child now renders
          in HomeView.tsx instead, as a sibling below this whole hero card,
          not nested inside it.
          h-full + justify-end (moved down from the outer hero div above):
          this wrapper now always fills the hero's own full height exactly —
          a fixed h-[70dvh] on mobile, whatever flex-1 resolves to on
          desktop — regardless of how tall the row's own content is, and
          justify-end bottom-anchors that row within this now-stable box.
          This is what makes the cover art's position:absolute below a
          reliable anchor: its nearest positioned ancestor (this element)
          always has the same top edge (the hero's own), never shifted
          around by content height the way an auto-height wrapper would be. */}
      <div className="relative z-10 flex h-full w-full flex-col justify-end p-[clamp(0.35rem,1.2vw,0.75rem)] md:p-[clamp(0.5rem,2vw,1.25rem)]">
      {/* Mobile: flex-col-reverse stacks the (later-in-DOM) cover above the
          text column. Desktop: md:flex-row puts it back in DOM order — text
          left, cover right — opposite the text block, in the empty space the
          hero background otherwise leaves bare. items-center centers each
          side against the row's cross axis: vertical on desktop, horizontal
          on mobile. The text column keeps w-full so this alignment never
          affects its own left-aligned content. */}
      <div className="flex w-full flex-col-reverse items-center gap-[clamp(1rem,3vw,2rem)] md:flex-row">
        {/* No margin hack here anymore — the hero above is now a real
            h-[70dvh] fixed box, and the outer hero div's own justify-end
            bottom-anchors this whole content block within that fixed
            budget naturally, no hand-tuned px/vh guess required. */}
        <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-[clamp(0.1rem,0.3vh,0.3rem)] md:gap-[clamp(0.2rem,0.7vh,0.5rem)]">
          <div className="flex flex-wrap items-center gap-2 pr-[12.75rem] md:pr-0">
            <div className="flex items-center gap-2 rounded-full border border-[rgb(var(--accent-from-rgb)/40%)] bg-white/10 px-2.5 py-1 backdrop-blur-md md:px-3 md:py-1.5">
              <span
                className={`h-2 w-2 rounded-full bg-success ${
                  isPlaying && !prefersReducedMotion ? "animate-pulse" : ""
                }`}
              />
              <span className="text-[clamp(0.625rem,1.4vw,0.75rem)] font-semibold tracking-wide text-[rgb(var(--accent-text-rgb))]">
                {t("home.onAirBadge")}
              </span>
            </div>

            {isAd && (
              <span className="rounded-full border border-white/15 bg-[rgb(var(--accent-from-rgb))] px-2.5 py-1 text-[clamp(0.625rem,1.4vw,0.75rem)] font-semibold tracking-wide text-background backdrop-blur-md md:px-3 md:py-1.5">
                {t("player.sponsorLabel")}
              </span>
            )}
          </div>

          <div className="max-w-full pr-[12.75rem] md:pr-0">
            {/* Mobile-base clamp floors lowered (noticeably smaller on
                narrow viewports); md: restores the exact original clamp so
                desktop is byte-identical to before this change. Marquee
                only engages when the title actually overflows — see
                MarqueeTitle below.
                pr- reserves the absolutely-positioned mobile cover art's own
                width (clamp ceiling 11rem) + its right-4 gutter + a small
                gap — at 50dvh this row's y-band now falls inside the cover
                art's y-band (it didn't at 70dvh, where there was ~94px of
                clear space below it), so a long/marquee-scrolling title
                would otherwise paint under the cover art instead of stopping
                short of it. md:pr-0: desktop's cover art is a normal
                flex-row sibling, never absolute, so no reservation needed
                there. */}
            <MarqueeTitle
              text={track}
              className="text-[clamp(1rem,4.5vw,2.85rem)] font-bold leading-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] md:text-[clamp(1.35rem,4.5vw,2.85rem)]"
            />
            {!isAd && (
              <p className="mt-0.5 truncate text-[clamp(0.75rem,2vw,1.25rem)] text-foreground/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:mt-1 md:text-[clamp(0.875rem,2vw,1.25rem)]">
                {artist}
              </p>
            )}
          </div>

          {!isAd && (
            <p className="max-w-full truncate text-[clamp(0.65rem,1.6vw,1rem)] text-foreground/60 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-[clamp(0.75rem,1.6vw,1rem)]">
              {t("home.tagline")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile: smaller pill, height floor stops at 2.75rem/44px —
                the WCAG minimum tap target, never smaller. md: restores the
                original (larger) clamp values, desktop unchanged. */}
            <PlayButton
              className="h-[clamp(2.75rem,4vh,3rem)] px-[clamp(0.9rem,3vw,1.5rem)] text-[clamp(0.75rem,1.4vw,0.9rem)] md:h-[clamp(3rem,7vh,4rem)] md:px-[clamp(1.5rem,4vw,2.25rem)] md:text-[clamp(0.9rem,1.6vw,1.05rem)]"
              iconClassName="h-5 w-5"
            />

            {isAd && adLink && (
              <a
                href={adLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[clamp(3rem,7vh,4rem)] shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-[clamp(1.25rem,3.5vw,1.75rem)] text-[clamp(0.85rem,1.5vw,1rem)] font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {t("player.visitSponsor")}
              </a>
            )}
          </div>

          {/* Row on every breakpoint now (waveform left, stats right) —
              mobile used to stack these (flex-col); md:gap-6 gives desktop
              extra breathing room the tighter mobile gap-2 doesn't need. */}
          <div className="flex w-full flex-row items-center gap-2 md:gap-6">
            <div className="min-w-0 flex-1">
              <HomeWaveform
                heightClassName="h-[clamp(0.9rem,2.2vh,1.35rem)] md:h-[clamp(1.75rem,6vh,3.25rem)]"
                barCountMobile={26}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <div className="flex flex-col items-start">
                <span className="text-[clamp(0.95rem,2.6vw,1.4rem)] font-bold leading-none text-[rgb(var(--accent-text-rgb))] md:text-[clamp(1.25rem,3.5vw,2rem)]">
                  {listenersCount}
                </span>
                <span className="mt-0.5 text-[clamp(0.55rem,1vw,0.7rem)] text-muted md:mt-1 md:text-[clamp(0.625rem,1.2vw,0.75rem)]">
                  {t("home.statsListenersLabel")}
                </span>
              </div>

              <span className="h-6 w-px shrink-0 bg-white/20 md:h-8" aria-hidden="true" />

              <div className="flex flex-col items-start">
                <span className="text-[clamp(0.95rem,2.6vw,1.4rem)] font-bold leading-none text-[rgb(var(--accent-text-rgb))] md:text-[clamp(1.25rem,3.5vw,2rem)]">
                  24/7
                </span>
                <span className="mt-0.5 text-[clamp(0.55rem,1vw,0.7rem)] text-muted md:mt-1 md:text-[clamp(0.625rem,1.2vw,0.75rem)]">
                  {t("home.statsLiveLabel")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Large cover art, opposite the text column — only for real tracks.
            In ad mode the hero background is already the ad's own image
            (and the mini-player's thumbnail shows it too), so a second copy
            here would just be redundant.
            Mobile: position:absolute, anchored to the z-10 content wrapper
            above (`relative z-10 ...`) — its NEAREST positioned ancestor,
            physically unchanged from before. What changed is making that
            wrapper's own position STABLE: it's now h-full (see its own
            className below) so its top edge always sits exactly at the
            hero's own top edge, a fixed h-[70dvh] box — independent of how
            tall the row's text content is. It didn't used to be h-full, so
            its top edge was wherever justify-end + its own (content-driven)
            height happened to put it; moving the three-card section out of
            this hero shrank that content height and pushed the wrapper's
            top edge ~400px lower, dragging this element's top-[10rem]-from-
            wrapper-top position down with it despite this className never
            changing — exactly the kind of drift the "don't touch cover art"
            constraint was worried about, just from an indirect cause
            instead of a direct edit. Anchoring against a height that's now
            fixed instead of content-driven means this stays put regardless
            of future copy changes, not just correct today. md: back to a
            normal static flex child — desktop's own position (flex-row,
            opposite the text column) is completely unaffected, never
            touches position:absolute at all. */}
        {!isAd && (
          <div className="absolute top-[calc(10rem+10vh)] right-4 shrink-0 md:static md:top-auto md:right-auto">
            <AnimatePresence mode="wait">
              <motion.img
                key={coverArt}
                src={coverArt}
                alt=""
                aria-hidden="true"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: hasCoverArt ? 1 : 0, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                className="h-[clamp(7rem,18vh,11rem)] w-[clamp(7rem,18vh,11rem)] shrink-0 rounded-3xl border-2 border-[rgb(var(--accent-from-rgb)/60%)] object-cover shadow-[0_0_32px_-6px_rgb(var(--accent-from-rgb)/70%),0_12px_28px_-8px_rgba(0,0,0,0.6)] md:h-[clamp(11rem,32vh,20rem)] md:w-[clamp(11rem,32vh,20rem)]"
              />
            </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// Horizontal marquee for the track title specifically — only when it
// actually overflows its container at the current font size; short titles
// render as a plain static (truncated as a safety net, though it should
// never actually need to truncate once this measurement is correct) line,
// never scrolling. A separate always-mounted invisible measuring span
// (not the visible one, which swaps between the static/marquee markup)
// is what makes re-measurement correct even after the title has already
// started scrolling — measuring the visible node directly would go stale
// once it stops being an unbroken single-line element, so a later short
// title could never be detected as "no longer overflowing" and switch back.
// prefers-reduced-motion: renders the static branch outright instead of an
// animated-but-motionless marquee, matching how continuous motion is
// avoided elsewhere in this app (also backstopped at the CSS level in
// globals.css, same belt-and-suspenders pattern as .logo-shine there).
function MarqueeTitle({ text, className }: { text: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function measure() {
      if (containerRef.current && measureRef.current) {
        setIsOverflowing(measureRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  const shouldScroll = isOverflowing && !prefersReducedMotion;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <span ref={measureRef} aria-hidden="true" className="invisible absolute whitespace-nowrap">
        {text}
      </span>

      {shouldScroll ? (
        <div className="flex w-max animate-marquee whitespace-nowrap">
          <span className="pe-16">{text}</span>
          <span aria-hidden="true" className="pe-16">
            {text}
          </span>
        </div>
      ) : (
        <span className="block truncate whitespace-nowrap">{text}</span>
      )}
    </div>
  );
}

// No icon package in this project (every icon here is a hand-drawn inline
// SVG, see PlayButton.tsx/navItems.tsx/etc.) — hand-drawn to match Tabler's
// "microphone" glyph rather than pulling in @tabler/icons-react for one icon.
function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}
