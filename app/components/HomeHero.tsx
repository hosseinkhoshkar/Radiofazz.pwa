"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "../context/PlayerContext";
import { useLanguage } from "../context/LanguageContext";
import { DEFAULT_COVER_ART } from "@/lib/itunes";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";
import PlayButton from "./PlayButton";
import HomeWaveform from "./HomeWaveform";
import MarqueeText from "./MarqueeText";

// Splits a tagline into "up to, and including, the first comma" / "rest" —
// works across all three languages since every one of them happens to use
// a comma-like character (",", or the Persian "،") at the same clause
// break. Used only to force a two-line mobile layout (see HomeHero below);
// desktop renders the tagline as one unbroken string, untouched.
function splitTaglineAtComma(text: string): [string, string] | null {
  const match = text.match(/^(.*?[,،])\s*(.+)$/);
  return match ? [match[1], match[2]] : null;
}

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
  const { track, artist, isPlaying, listeners, isAd, adLink, coverArt, isOffline } = usePlayer();
  const { t, lang } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobileViewport();

  const tagline = t("home.tagline");
  const taglineSplit = splitTaglineAtComma(tagline);

  const listenersCount = new Intl.NumberFormat(NUMBER_LOCALES[lang] ?? "en-US").format(listeners);

  // No API-found art for this track — collapse its space entirely (width to
  // 0 on the md+ flex row, reserved mobile padding to 0) rather than hiding
  // it behind opacity while still holding the layout slot. The text
  // column/waveform (md: via flex-1 on the now-wider row; mobile: via the
  // freed pr- reservation) reflow to fill whatever space opens up. Same
  // 400ms timing as the image's own crossfade below, so the collapse and
  // the fade read as one motion.
  const hasCoverArt = coverArt !== DEFAULT_COVER_ART;
  // Background photo is always the static hero image, ad mode included — the
  // ad's own image belongs in the cover-art slot below (same box a track's
  // art renders in), not stretched full-bleed here. ads.json images are wide
  // banner-shaped placeholders (600x150); object-cover-ing one across the
  // whole hero card blows it up into an illegible crop.
  const heroImageSrc = HERO_IMAGE_URL;
  const collapseDurationClass = prefersReducedMotion ? "duration-0" : "duration-[400ms]";

  return (
    // Mobile: hard-capped h-[63dvh] (up from 50dvh) — the three-card section used to live
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
    // Phone-landscape (orientation:landscape, max-height:500px — same
    // threshold the old rotation hack used, tallest phone landscape is
    // ~430px, shortest tablet landscape is ~768px, wide safety margin
    // either side) — the three-card row is hidden entirely there (see
    // HomeQuickLinks.tsx) for lack of vertical room, so the hero switches
    // to the same flex-1/auto-height behavior md+ already uses, expanding
    // to fill whatever it would otherwise have shared with that row.
    <div className="relative isolate flex h-[63dvh] w-full flex-col overflow-hidden rounded-3xl border border-foreground/10 [clip-path:inset(0_round_1.5rem)] [@media(orientation:landscape)_and_(max-height:500px)]:h-auto [@media(orientation:landscape)_and_(max-height:500px)]:min-h-0 [@media(orientation:landscape)_and_(max-height:500px)]:flex-1 md:h-auto md:min-h-0 md:flex-1">
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
          translate, 28rem max) unchanged.
          Hidden outright in phone-landscape (orientation:landscape,
          max-height:500px), forced with `!` since it overlaps the md:
          media query at 768px+ widths (812/896/932) and needs to reliably
          win: at md+ this glyph normally shares the RIGHT side with the
          cover art (safe only because a tall hero keeps them far apart
          vertically — logo pinned near the top, cover art bottom-anchored).
          Once the hero is this short there's no corner genuinely clear of
          both the cover art AND the now-much-closer text column (tried
          moving it to the mobile-style left position first — it ended up
          sitting behind the artist-name line instead, just a different
          collision) — it's purely decorative, so dropping it here entirely
          is the clean fix, same treatment as the three-card row. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-8 z-[5] flex flex-col items-center md:left-auto md:-right-12 md:top-8 md:-translate-x-[45%] [@media(orientation:landscape)_and_(max-height:500px)]:!hidden"
      >
        <div
          data-testid="hero-logo-visual"
          // md size was a flat clamp(16rem,42vh,28rem) — at moderate desktop
          // heights (~700-1024px, common laptop viewports) that grows tall
          // enough to run straight into the bottom-anchored text/cover-art
          // row below (verified via a Playwright bounding-box sweep across
          // 360-1440px: real overlap at every desktop width for every
          // tested height up to 1024px, e.g. 1024x768 and 1440x900 — only
          // the tallest tested height, 1180px, happened to clear it). The
          // row's own top edge moves down with viewport height too, but
          // non-linearly (its growth accelerates above ~h:1000), so a
          // flat vh fraction can't just be shrunk uniformly without also
          // either shrinking the logo needlessly at tall viewports or still
          // colliding at moderate ones. calc(100vh - 730px) delays growth
          // until there's actually headroom: pinned at the 5rem floor
          // through ~h:810, then ramps up to reach the original 28rem
          // ceiling by ~h:1180 (unchanged there — verified 23px+ clearance
          // at every tested width/height combination, floor included).
          // Phone-landscape forces it down to a small fixed 3rem (also `!`,
          // same reason as the wrapper's position above) — small and
          // top-left is enough to stay clearly separate from the cover art
          // at this height without needing its own bespoke clamp.
          className="relative flex h-[clamp(6rem,20vh,9rem)] w-[clamp(6rem,20vh,9rem)] shrink-0 items-center justify-center rounded-full md:h-[clamp(5rem,calc(100vh_-_730px),28rem)] md:w-[clamp(5rem,calc(100vh_-_730px),28rem)] [@media(orientation:landscape)_and_(max-height:500px)]:!h-12 [@media(orientation:landscape)_and_(max-height:500px)]:!w-12"
        >
          {/* Soft glowing halo ring, palette-colored — crossfades with the
              track's active accent via the shared --accent-from-rgb/
              --accent-to-rgb vars, same mechanism as every other
              palette-synced glow in the app. Sits behind the blended
              ring/mic layer and the solid logo image. */}
          <div
            className="absolute -inset-4 rounded-full opacity-70 blur-2xl md:-inset-8"
            style={{
              background:
                "radial-gradient(circle, rgb(var(--accent-from-rgb)/60%), rgb(var(--accent-to-rgb)/25%) 55%, transparent 75%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full opacity-45 blur-[0.4px]"
            style={{ mixBlendMode: "screen" }}
          >
            <div className="h-full w-full rounded-full border-2 border-[rgb(var(--accent-from-rgb))] shadow-[0_0_80px_10px_rgb(var(--accent-from-rgb)/60%)]" />
            <MicIcon className="absolute inset-0 m-auto h-[55%] w-[55%] text-[rgb(var(--accent-from-rgb))] drop-shadow-[0_0_24px_rgb(var(--accent-from-rgb)/80%)]" />
          </div>
          {/* Logo image sits outside the blended/dimmed layer above so it
              reads solid (95% opaque) rather than washed into the
              background like the ring/mic glow. */}
          <img
            src="/images/logo-faaz.png"
            alt=""
            className="absolute inset-0 m-auto h-[85%] w-[85%] rounded-full object-contain opacity-95"
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
      <div className="relative z-10 flex h-full w-full flex-col justify-end p-[clamp(0.35rem,1.2vw,0.75rem)] md:p-[clamp(0.5rem,min(2vw,3vh),1.25rem)]">
      {/* Mobile: flex-col-reverse stacks the (later-in-DOM) cover above the
          text column. Desktop: md:flex-row puts it back in DOM order — text
          left, cover right — opposite the text block, in the empty space the
          hero background otherwise leaves bare. items-center centers each
          side against the row's cross axis: vertical on desktop, horizontal
          on mobile. The text column keeps w-full so this alignment never
          affects its own left-aligned content. */}
      <div
        className={`flex w-full flex-col-reverse items-center gap-[clamp(1rem,3vw,2rem)] transition-[column-gap] ${collapseDurationClass} ease-out md:flex-row ${
          hasCoverArt ? "md:gap-x-[clamp(1rem,3vw,2rem)]" : "md:gap-x-0"
        }`}
      >
        {/* No margin hack here anymore — the hero above is now a real
            h-[70dvh] fixed box, and the outer hero div's own justify-end
            bottom-anchors this whole content block within that fixed
            budget naturally, no hand-tuned px/vh guess required. */}
        {/* translate-x-[1%]: shifts this text/controls column only — not
            the cover art (its own sibling) or the hero background image
            (a separate absolutely-positioned layer above) — 1% to the
            right of its own width. */}
        <div className="flex w-full min-w-0 flex-1 translate-x-[1%] flex-col items-start gap-[clamp(0.1rem,0.3vh,0.3rem)] md:gap-[clamp(0.2rem,0.7vh,0.5rem)]">
          <div
            className={`mt-[clamp(-0.375rem,calc(-2.24px_-_0.49vw),-0.25rem)] flex flex-wrap items-center gap-2 transition-[padding-right] ${collapseDurationClass} ease-out md:pr-0 ${
              hasCoverArt ? "pr-[12.75rem]" : "pr-0"
            }`}
          >
            {/* Glassy background — accent-tinted translucent fill (was a
                neutral bg-white/10) + a stronger backdrop-blur, so it
                actually reads as frosted glass rather than a flat tinted
                pill. Offline: flips to a neutral gray glass instead of the
                accent tint — a deliberately "quiet" look, distinct from
                every other (accent-colored) state in the app, rather than
                a jarring danger-red alarm for what's framed as a transient,
                auto-recovering condition. */}
            <div
              className={`relative flex items-center gap-2 rounded-full border px-2.5 py-1 backdrop-blur-lg md:px-3 md:py-1.5 ${
                isOffline
                  ? "border-white/15 bg-white/10"
                  : "border-[rgb(var(--accent-from-rgb)/40%)] bg-[rgb(var(--accent-from-rgb)/16%)] shadow-[0_0_24px_-4px_rgb(var(--accent-from-rgb)/80%),0_0_12px_-2px_rgb(var(--accent-to-rgb)/60%)]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOffline
                    ? "bg-muted"
                    : `bg-success ${isPlaying && !prefersReducedMotion ? "animate-pulse" : ""}`
                }`}
              />
              <span
                className={`text-[clamp(0.7rem,1.6vw,0.85rem)] font-semibold tracking-wide ${
                  isOffline ? "text-muted" : "text-[rgb(var(--accent-text-rgb))]"
                }`}
              >
                {isOffline ? t("player.offlineBadge") : t("home.onAirBadge")}
              </span>
            </div>

            {isAd && (
              <span className="rounded-full border border-white/15 bg-[rgb(var(--accent-from-rgb))] px-2.5 py-1 text-[clamp(0.7rem,1.6vw,0.85rem)] font-semibold tracking-wide text-background backdrop-blur-md md:px-3 md:py-1.5">
                {t("player.sponsorLabel")}
              </span>
            )}
          </div>

          <div
            // Was a hard mt-3/md:mt-0 jump — fluid clamp(0px, calc(...), 0.75rem)
            // instead: calibrated to hit 0.75rem exactly at 360px and 0px
            // exactly at 768px (same two values as before, same crossover
            // point), so nothing changes at 375px or any md+ width — only
            // smooths the 360-768px range that used to snap in one step.
            className={`mt-[clamp(0px,calc(22.59px_-_2.94vw),0.75rem)] max-w-full transition-[padding-right] ${collapseDurationClass} ease-out md:pr-0 ${
              hasCoverArt ? "pr-[12.75rem]" : "pr-0"
            }`}
          >
            {/* Mobile-base clamp floors lowered (noticeably smaller on
                narrow viewports); md: restores the exact original clamp so
                desktop is byte-identical to before this change. Marquee
                only engages when the title actually overflows — see
                MarqueeText (shared with the mini-player's title/artist).
                pr- reserves the absolutely-positioned mobile cover art's own
                width (clamp ceiling 11rem) + its right-4 gutter + a small
                gap — at 50dvh this row's y-band now falls inside the cover
                art's y-band (it didn't at 70dvh, where there was ~94px of
                clear space below it), so a long/marquee-scrolling title
                would otherwise paint under the cover art instead of stopping
                short of it. Collapses to pr-0 when there's no cover art to
                protect against (see hasCoverArt above), not just on desktop.
                md:pr-0: desktop's cover art is a normal flex-row sibling,
                never absolute, so no reservation needed there regardless. */}
            {/* ~18% off both the floor and ceiling of both clamps (mobile
                1rem->0.8rem, 2.85rem->2.35rem; md 1.35rem->1.1rem, same new
                2.35rem ceiling) plus the preferred term (4.5vw->3.7vw) — a
                prior pass apparently missed the shared 2.85rem ceiling,
                which is what actually caps the size on every viewport once
                4.5vw exceeds it (true from ~1013px up), so desktop never
                visibly shrank last time. This pass touches all three
                numbers in both clamps so every breakpoint's rendered size
                actually drops. */}
            {/* This view's only heading — the live track title IS Home's
                actual primary content, so it doubles as the page's h1
                rather than a separate, redundant "Now Playing" label
                (screen-reader users navigating by heading otherwise found
                no heading at all on this view). Not aria-live: it changes
                every ~15s with the stream, and announcing every track
                change would be noise, not help — see the offline message
                below for the one Home-view state that does get announced. */}
            <MarqueeText
              as="h1"
              text={track}
              className="text-[clamp(0.9rem,4.1vw,2.6rem)] font-bold leading-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] md:text-[clamp(1.1rem,min(4.1vw,5.5vh),2.6rem)]"
            />
            {/* Offline: skip this line entirely rather than showing the
                tagline here too — offline's fallback `artist` value is the
                same tagline string the block below already renders (kept
                that way for the mini-player, which has no separate tagline
                line of its own), so showing both here would just repeat
                the same sentence twice in a row. */}
            {!isAd && !isOffline && (
              <p className="mt-[clamp(0.125rem,calc(0.24px_+_0.49vw),0.25rem)] truncate text-[clamp(0.85rem,2.2vw,1.4rem)] text-foreground/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-[clamp(1rem,min(2.2vw,5vh),1.4rem)]">
                {artist}
              </p>
            )}
          </div>

          {!isAd && (
            // Mobile-only: forced two-line break right at the tagline's
            // comma (explicit <br>, not natural wrapping — stays consistent
            // regardless of exact mobile viewport width) via an
            // md:truncate/no-truncate swap, since `truncate`'s
            // white-space:nowrap would otherwise suppress the <br>. Desktop
            // keeps the exact original single-line truncating behavior.
            <p className="max-w-full text-[clamp(0.73rem,1.8vw,1.12rem)] text-foreground/60 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:truncate md:text-[clamp(0.85rem,1.8vw,1.12rem)]">
              {isMobile && taglineSplit ? (
                <>
                  {taglineSplit[0]}
                  <br />
                  {taglineSplit[1]}
                </>
              ) : (
                tagline
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile: smaller pill, height floor stops at 2.75rem/44px —
                the WCAG minimum tap target, never smaller. md: restores the
                original (larger) clamp values, desktop unchanged. */}
            <PlayButton
              className="h-[clamp(2.75rem,4vh,3rem)] px-[clamp(0.9rem,3vw,1.5rem)] text-[clamp(0.85rem,1.6vw,1.02rem)] md:h-[clamp(2.75rem,7vh,4rem)] md:px-[clamp(1.5rem,4vw,2.25rem)] md:text-[clamp(1.02rem,1.8vw,1.18rem)]"
              iconClassName="h-5 w-5"
              disabled={isOffline}
            />

            {isAd && adLink && (
              <a
                href={adLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[clamp(3rem,7vh,4rem)] shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-[clamp(1.25rem,3.5vw,1.75rem)] text-[clamp(0.95rem,1.7vw,1.12rem)] font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {t("player.visitSponsor")}
              </a>
            )}
          </div>

          {isOffline && (
            // Rare, meaningful state change (unlike the track title above,
            // which changes constantly and is deliberately not live) — worth
            // announcing to screen reader users who aren't looking at the
            // screen when the stream drops.
            <p role="status" aria-live="polite" className="max-w-full text-[clamp(0.7rem,1.6vw,0.85rem)] text-muted">
              {t("player.offlineMessage")}
            </p>
          )}

          {/* Row on every breakpoint now (waveform left, stats right) —
              mobile used to stack these (flex-col). Both mt- and gap- were
              hard mobile/md jumps (16px->24px, 8px->24px); now fluid
              clamp()s calibrated to the exact same two values at 360px and
              768px, so 375px and every md+ width render byte-identical to
              before — only the 360-768px range now interpolates instead of
              snapping. */}
          <div className="mt-[clamp(1rem,min(calc(8.94px_+_1.96vw),3vh),1.5rem)] flex w-full flex-row items-center gap-[clamp(0.5rem,calc(-6.12px_+_3.92vw),1.5rem)]">
            <div className="min-w-0 flex-1">
              <HomeWaveform
                heightClassName="h-[clamp(0.9rem,2.2vh,1.35rem)] md:h-[clamp(1.75rem,6vh,3.25rem)]"
                barCountMobile={26}
              />
            </div>

            <div className="flex shrink-0 items-center gap-[clamp(0.5rem,calc(4.47px_+_0.98vw),0.75rem)]">
              <div className="flex flex-col items-start">
                <span className="text-[clamp(1.06rem,2.9vw,1.57rem)] font-bold leading-none text-[rgb(var(--accent-text-rgb))] md:text-[clamp(1.1rem,min(3.9vw,5.5vh),2.25rem)]">
                  {listenersCount}
                </span>
                <span className="mt-[clamp(0.125rem,calc(0.24px_+_0.49vw),0.25rem)] text-[clamp(0.62rem,1.1vw,0.78rem)] text-muted md:text-[clamp(0.7rem,1.35vw,0.84rem)]">
                  {t("home.statsListenersLabel")}
                </span>
              </div>

              <span
                className="w-px shrink-0 bg-white/20 h-[clamp(1.5rem,calc(16.94px_+_1.96vw),2rem)]"
                aria-hidden="true"
              />

              <div className="flex flex-col items-start">
                <span className="text-[clamp(1.06rem,2.9vw,1.57rem)] font-bold leading-none text-[rgb(var(--accent-text-rgb))] md:text-[clamp(1.1rem,min(3.9vw,5.5vh),2.25rem)]">
                  24/7
                </span>
                <span className="mt-[clamp(0.125rem,calc(0.24px_+_0.49vw),0.25rem)] text-[clamp(0.62rem,1.1vw,0.78rem)] text-muted md:text-[clamp(0.7rem,1.35vw,0.84rem)]">
                  {t("home.statsLiveLabel")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Large cover art, opposite the text column — renders for both real
            tracks and ad mode (coverArt already resolves to the ad's own
            image via PlayerContext when isAd is true, same as a track's
            artwork). ads.json images are wide banner-shaped placeholders, not
            square art, but this box's object-cover crop reads fine at this
            size — unlike stretching one across the full hero background,
            which is illegible (see heroImageSrc above).
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
        {
          // overflow-visible on mobile (was overflow-hidden on every
          // breakpoint) — mobile never actually collapses this wrapper's
          // width (the hasCoverArt width classes below are md:-only), so
          // the clip served no purpose there and was silently clipping any
          // glow away at zero headroom (wrapper == image size exactly).
          // Freeing it doesn't move or resize the image itself at all — the
          // absolute top-[...]/right-4 anchor and the image's own size are
          // completely untouched, so mobile's cover art position stays
          // pixel-identical (locked, see task history). md:overflow-hidden
          // still clips the width->0 collapse transition as before; md:p-3
          // + the wider md:w-[...] give that clip room for the glow ring to
          // actually render instead of being clipped at zero headroom too.
          <div
            // top offset: min() caps the normal tuned formula (10rem+10vh,
            // right for tall portrait phones) against the hero's own actual
            // height (63dvh) minus the art's max size + margin (11rem+1rem)
            // — on very short landscape phones the uncapped formula would
            // push the art's bottom edge past the hero's own bottom edge,
            // clipped by the hero's overflow-hidden (violates the "cover art
            // must never be clipped" constraint). Only binds when the hero
            // is too short for the tuned value to fit; tall viewports are
            // unaffected since the tuned formula stays smaller there.
            className={`absolute top-[min(calc(10rem+10vh),calc(63dvh_-_12rem))] right-4 flex shrink-0 items-center justify-center overflow-visible transition-[width] ${collapseDurationClass} ease-out md:static md:top-auto md:right-auto md:overflow-hidden ${
              hasCoverArt ? "md:w-[clamp(6rem,32vh,21.5rem)] md:p-3" : "md:w-0 md:p-0"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={coverArt}
                data-testid="hero-cover-art"
                src={coverArt}
                alt=""
                aria-hidden="true"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: hasCoverArt ? 1 : 0, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                // md floor lowered 11rem -> 4.5rem: on phone-landscape
                // viewports (e.g. 812x375) the hero's own flex-1 height
                // shrinks a lot, and 11rem was tall enough to force an
                // overflow/clip there. The 32vh preferred term already
                // exceeds even the old floor above ~550px of height, so
                // normal portrait/tablet/desktop sizing is unchanged —
                // this only takes effect on genuinely short viewports.
                className="relative h-[clamp(7rem,18vh,11rem)] w-[clamp(7rem,18vh,11rem)] shrink-0 rounded-3xl object-cover md:h-[clamp(4.5rem,32vh,20rem)] md:w-[clamp(4.5rem,32vh,20rem)]"
              />
            </AnimatePresence>
          </div>
        }
      </div>
      </div>
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
