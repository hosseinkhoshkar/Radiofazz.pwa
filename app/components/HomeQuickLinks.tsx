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
const CARD_CLASSES =
  "group relative isolate flex h-[clamp(7rem,18vh,9.5rem)] w-[92%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-3xl border border-white/10 text-start shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] [clip-path:inset(0_round_1.5rem)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] md:h-[clamp(9rem,22vh,12.5rem)] md:w-auto";

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
      {/* Dark scrim for text contrast over the card's own photo. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/90 via-black/60 to-black/25" />
      {/* Glassmorphic blur/tint layer sitting on top of the scrim+photo —
          the backdrop-blur compositing layer needs its own radius, parent
          clipping alone isn't reliable for it. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-background-elevated/35 backdrop-blur-[0.5px]" />
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
    <div className="relative z-10 flex flex-col gap-1 p-[clamp(1rem,2.2vw,1.4rem)]">
      <p className="truncate text-[clamp(1.05rem,1.8vw,1.3rem)] font-bold text-foreground">{title}</p>
      <p className="line-clamp-2 text-[clamp(0.75rem,1.3vw,0.9rem)] text-muted">{description}</p>
      <span className="mt-1 text-[clamp(0.75rem,1.3vw,0.9rem)] font-semibold text-[rgb(var(--accent-text-rgb))]">
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
    <div className="flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-2 md:overflow-visible md:pb-0">
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
