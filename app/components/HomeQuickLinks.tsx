"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useView } from "../context/ViewContext";
import { getUpcomingEvents, type EventItem } from "@/lib/events";
import { formatEventDate } from "@/lib/i18n/format";
import type { TranslationKey } from "@/lib/i18n/translations";

const EVENTS_URL = "/data/events.json";

// Mobile: horizontal snap-scroll (peeking next card) — the hero already
// claims most of the no-scroll viewport, so this row never stacks
// vertically on small screens. Desktop: a plain 3-column row. Each card is
// its own visual unit floating on the hero's extended background photo:
// own themed image -> dark gradient scrim -> glass blur/tint -> content.
const DJ_IMAGE_URL =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop&crop=entropy&auto=format&q=60";
const EVENT_IMAGE_URL =
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop&crop=entropy&auto=format&q=60";
const AD_IMAGE_URL =
  "https://images.unsplash.com/photo-1760895653496-b28ed02f3705?w=800&h=600&fit=crop&crop=entropy&auto=format&q=60";

// backdrop-blur-md below is a compositing layer — Chromium/WebKit can paint
// its blur past the parent's overflow-hidden clip at the rounded corners
// unless the blur layer carries its own matching radius. isolate pins a new
// stacking context so the blur composites inside this box, and the
// clip-path is a hard fallback clip that isn't skipped for filter layers
// the way overflow-hidden sometimes is.
// Mobile height clamp lowered from the desktop one (max 12.5rem/200px ->
// 9.5rem/152px) — with the hero above now a hard h-[70dvh], this row is
// the one remaining lever to keep it fully clear of the fixed mini-player
// bar without touching the hero's own height or the cover art inside it.
// md: restores the exact original clamp, desktop unaffected.
// Phone-landscape variant (e.g. iPhone 14 Pro Max at 932x430): a custom
// arbitrary-variant media query gated on BOTH landscape orientation and a
// short max-height, not width — width alone can't distinguish a landscape
// phone (932px wide) from a tablet/desktop, but a phone in landscape is
// always short. 500px clears every landscape phone (tallest is ~430px) while
// staying well under the shortest landscape tablet (iPad mini is 768px
// tall), so this never fires on anything but a phone on its side. `!`
// (important) on every override here because plain source-order can't be
// trusted to beat the existing `md:` rules once viewport width crosses 768px
// (a 932px-wide phone already qualifies for `md:` too) — important pins the
// win to orientation regardless of which width bucket also matched.
//
// IMPORTANT (Tailwind v4 scanning): every one of these classes below is
// spelled out in full, literally, in this file's source text — Tailwind's
// build-time scanner extracts classes via a static regex over the raw
// source, it never evaluates JS. A shared `const PL = "[@media(...)]:"`
// spliced in via `${PL}!h-7` looks like a real class at runtime but is
// invisible to the scanner (the source bytes are literally `${PL}!h-7`, not
// the expanded string), so no CSS gets generated for it. Learned this the
// hard way — first pass used the `${PL}` template and silently produced
// zero matching rules in the compiled stylesheet.
const CARD_CLASSES =
  "group relative isolate flex h-[clamp(7rem,18vh,9.5rem)] w-[92%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-3xl border border-white/10 text-start shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] [clip-path:inset(0_round_1.5rem)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] md:h-[clamp(9rem,22vh,12.5rem)] md:w-auto " +
  // ~20% of the normal mobile-portrait card height (7rem-9.5rem tall) ->
  // a compact ~1.75rem/28px button, row-centered content, no scroll-snap.
  "[@media(orientation:landscape)_and_(max-height:500px)]:!h-7 [@media(orientation:landscape)_and_(max-height:500px)]:!w-full [@media(orientation:landscape)_and_(max-height:500px)]:!shrink [@media(orientation:landscape)_and_(max-height:500px)]:!flex-row [@media(orientation:landscape)_and_(max-height:500px)]:!items-center [@media(orientation:landscape)_and_(max-height:500px)]:!justify-center [@media(orientation:landscape)_and_(max-height:500px)]:!rounded-xl [@media(orientation:landscape)_and_(max-height:500px)]:!border-[rgb(var(--accent-from-rgb)/40%)] [@media(orientation:landscape)_and_(max-height:500px)]:!bg-[rgb(var(--accent-from-rgb)/14%)] [@media(orientation:landscape)_and_(max-height:500px)]:!backdrop-blur-md [@media(orientation:landscape)_and_(max-height:500px)]:!shadow-none [@media(orientation:landscape)_and_(max-height:500px)]:hover:!translate-y-0 [@media(orientation:landscape)_and_(max-height:500px)]:hover:!scale-100";

function CardImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="absolute inset-0 h-full w-full rounded-3xl object-cover [@media(orientation:landscape)_and_(max-height:500px)]:!hidden"
    />
  );
}

function CardGlow() {
  return (
    <>
      {/* Dark scrim for text contrast over the card's own photo — lightened
          from /90-/60-/25 so the photo itself reads clearer/less obscured,
          while still keeping the title/description legible. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/40 to-black/10 [@media(orientation:landscape)_and_(max-height:500px)]:!hidden" />
      {/* Glassmorphic blur/tint layer sitting on top of the scrim+photo —
          the backdrop-blur compositing layer needs its own radius, parent
          clipping alone isn't reliable for it. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-background-elevated/22 backdrop-blur-[0.5px] [@media(orientation:landscape)_and_(max-height:500px)]:!hidden" />
      {/* Faint palette-colored glow anchored to a corner — ties the glass
          panel to the track's active accent. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-60 [@media(orientation:landscape)_and_(max-height:500px)]:!hidden"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgb(var(--accent-from-rgb)/30%), transparent 65%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/0 transition-colors duration-300 group-hover:bg-white/5 [@media(orientation:landscape)_and_(max-height:500px)]:!hidden" />
    </>
  );
}

function CardBody({
  title,
  description,
  ctaKey = "events.viewMore",
}: {
  title: React.ReactNode;
  description: string;
  ctaKey?: TranslationKey;
}) {
  const { t } = useLanguage();

  return (
    <div className="relative z-10 flex flex-col gap-1 p-[clamp(1rem,2.2vw,1.4rem)] [@media(orientation:landscape)_and_(max-height:500px)]:!w-full [@media(orientation:landscape)_and_(max-height:500px)]:!items-center [@media(orientation:landscape)_and_(max-height:500px)]:!justify-center [@media(orientation:landscape)_and_(max-height:500px)]:!gap-0 [@media(orientation:landscape)_and_(max-height:500px)]:!p-1">
      <p
        className="truncate text-[clamp(1.18rem,2vw,1.45rem)] font-bold text-foreground [@media(orientation:landscape)_and_(max-height:500px)]:!max-w-full [@media(orientation:landscape)_and_(max-height:500px)]:!text-center [@media(orientation:landscape)_and_(max-height:500px)]:!text-[0.7rem] [@media(orientation:landscape)_and_(max-height:500px)]:!font-semibold"
        style={{
          textShadow:
            "0 0 12px rgb(var(--accent-from-rgb)/85%), 0 0 26px rgb(var(--accent-to-rgb)/55%)",
        }}
      >
        {title}
      </p>
      <p className="line-clamp-2 text-[clamp(0.84rem,1.45vw,1rem)] text-muted [@media(orientation:landscape)_and_(max-height:500px)]:!hidden">
        {description}
      </p>
      <span className="mt-1 text-[clamp(0.84rem,1.45vw,1rem)] font-semibold text-[rgb(var(--accent-text-rgb))] [@media(orientation:landscape)_and_(max-height:500px)]:!hidden">
        {t(ctaKey)}
      </span>
    </div>
  );
}

export default function HomeQuickLinks() {
  const { t, lang } = useLanguage();
  const { setView } = useView();
  const [nextEvent, setNextEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(EVENTS_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventItem[]) => {
        if (!cancelled) setNextEvent(getUpcomingEvents(data)[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setNextEvent(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-2 md:overflow-visible md:pb-0 [@media(orientation:landscape)_and_(max-height:500px)]:!grid [@media(orientation:landscape)_and_(max-height:500px)]:!grid-cols-3 [@media(orientation:landscape)_and_(max-height:500px)]:!gap-1.5 [@media(orientation:landscape)_and_(max-height:500px)]:!overflow-visible [@media(orientation:landscape)_and_(max-height:500px)]:!pb-0 [@media(orientation:landscape)_and_(max-height:500px)]:!snap-none">
      {/* Opens DJ Majid's own site in a new tab — a deliberate exception to
          this row's other two cards, which switch the internal view. The
          internal "DJ Majid" view is still reachable via the sidebar/tab-bar
          nav item; this card just points somewhere else now. */}
      <a
        href="https://www.dj-majid.de"
        target="_blank"
        rel="noopener noreferrer"
        className={CARD_CLASSES}
      >
        <CardImage src={DJ_IMAGE_URL} />
        <CardGlow />
        <CardBody
          title={
            <>
              {t("home.cards.djTitleBefore")}
              <span className="text-[rgb(var(--accent-text-rgb))]">{t("home.cards.djTitleName")}</span>
              {t("home.cards.djTitleAfter")}
            </>
          }
          description={t("about.subtitle")}
        />
      </a>

      <button type="button" onClick={() => setView("events")} className={CARD_CLASSES}>
        <CardImage src={EVENT_IMAGE_URL} />
        <CardGlow />
        <CardBody
          title={t("home.cards.eventsTitle")}
          description={
            nextEvent
              ? `${nextEvent.title} — ${formatEventDate(nextEvent.date, lang)}`
              : t("home.cards.eventsEmpty")
          }
        />
      </button>

      <button type="button" onClick={() => setView("contact")} className={CARD_CLASSES}>
        <CardImage src={AD_IMAGE_URL} />
        <CardGlow />
        <CardBody
          title={t("home.cards.adTitle")}
          description={t("home.cards.adSubtitle")}
          ctaKey="home.cards.adCta"
        />
      </button>
    </div>
  );
}
