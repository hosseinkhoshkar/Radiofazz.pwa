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
// min-h (not h) + a much lower md floor (12.5rem -> 4rem) — phone-landscape
// viewports (short and wide, e.g. 812x375) give this row very little
// vertical budget; min-h lets it shrink down toward that floor there while
// still growing to fit its own content (title/description/cta) rather than
// clipping it, which a fixed h- would. Normal taller viewports are
// unaffected either way since their vh-preferred value already clears the
// floor. CardBody's description line collapses away below ~480px of
// viewport height for the same reason (see its own comment).
const CARD_CLASSES =
  "group relative isolate flex min-h-[clamp(7rem,18vh,9.5rem)] w-[92%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-3xl border border-white/10 text-start shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] [clip-path:inset(0_round_1.5rem)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] md:min-h-[clamp(2.5rem,22vh,12.5rem)] md:w-auto";

function CardImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="absolute inset-0 h-full w-full rounded-3xl object-cover"
    />
  );
}

function CardGlow() {
  return (
    <>
      {/* Dark scrim for text contrast over the card's own photo — lightened
          from /90-/60-/25 so the photo itself reads clearer/less obscured,
          while still keeping the title/description legible. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
      {/* Glassmorphic blur/tint layer sitting on top of the scrim+photo —
          the backdrop-blur compositing layer needs its own radius, parent
          clipping alone isn't reliable for it. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-background-elevated/22 backdrop-blur-[0.5px]" />
      {/* Faint palette-colored glow anchored to a corner — ties the glass
          panel to the track's active accent. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-60"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgb(var(--accent-from-rgb)/30%), transparent 65%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />
    </>
  );
}

// True letter-by-letter neon-sign look — each character gets its own
// multi-layer text-shadow stack (tight white-hot core -> accent-from glow
// -> wider accent-to bloom), rather than one soft shadow blurred behind the
// whole string. Consecutive space characters are rendered as
// (non-breaking space): normal HTML whitespace collapsing rules treat a run
// of space-only text nodes/inline elements as a single collapsible space,
// which would otherwise eat every space beyond the first once each
// character is its own <span>.
function NeonText({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          className={className}
          style={{
            textShadow:
              "0 0 2px rgb(255 255 255/90%), 0 0 6px rgb(var(--accent-from-rgb)/95%), 0 0 12px rgb(var(--accent-from-rgb)/80%), 0 0 22px rgb(var(--accent-to-rgb)/70%), 0 0 36px rgb(var(--accent-to-rgb)/45%)",
          }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
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
    <div className="relative z-10 flex flex-col gap-1 p-[clamp(0.35rem,min(2.2vw,3.5vh),1.4rem)]">
      <p className="truncate text-[clamp(0.95rem,min(2vw,3.2vh),1.45rem)] font-bold text-foreground">
        {title}
      </p>
      {/* Both drop away on very short viewports (phone landscape, e.g.
          812x375) where this row has almost no vertical budget — the title
          alone still communicates what the card links to (it's a single
          clickable card either way), and description/CTA are the least
          essential lines to lose first. Portrait phones/tablets/desktop are
          all comfortably taller than this threshold, so unaffected. */}
      <p className="line-clamp-2 text-[clamp(0.84rem,1.45vw,1rem)] text-muted [@media(max-height:480px)]:hidden">
        {description}
      </p>
      <span className="mt-1 text-[clamp(0.84rem,1.45vw,1rem)] font-semibold text-[rgb(var(--accent-text-rgb))] [@media(max-height:480px)]:hidden">
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
    // Hidden entirely in phone landscape (orientation:landscape,
    // max-height:500px — same threshold the old rotation hack used) — that
    // range has almost no vertical room, and the hero (giant disc + track
    // info + play button) is the essential content; this row is secondary
    // navigation, not core to "now playing". Hero expands into the freed
    // space instead (see its own [@media(orientation:landscape)...] rules
    // in HomeHero.tsx). Every other breakpoint/orientation, including
    // tablet landscape (shortest is ~768px tall, well outside this query),
    // is completely unaffected.
    <div className="flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] snap-x snap-mandatory [@media(orientation:landscape)_and_(max-height:500px)]:hidden md:grid md:grid-cols-3 md:gap-2 md:overflow-visible md:pb-0">
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
              <NeonText text={t("home.cards.djTitleBefore")} />
              <NeonText
                text={t("home.cards.djTitleName")}
                className="text-[rgb(var(--accent-text-rgb))]"
              />
              <NeonText text={t("home.cards.djTitleAfter")} />
            </>
          }
          description={t("about.subtitle")}
        />
      </a>

      <button type="button" onClick={() => setView("events")} className={CARD_CLASSES}>
        <CardImage src={EVENT_IMAGE_URL} />
        <CardGlow />
        <CardBody
          title={<NeonText text={t("home.cards.eventsTitle")} />}
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
          title={<NeonText text={t("home.cards.adTitle")} />}
          description={t("home.cards.adSubtitle")}
          ctaKey="home.cards.adCta"
        />
      </button>
    </div>
  );
}
