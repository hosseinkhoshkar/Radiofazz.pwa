"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { formatEventDate } from "@/lib/i18n/format";
import { eventImageUrl, getUpcomingEvents, type EventItem } from "@/lib/events";
import type { Lang, TranslationKey } from "@/lib/i18n/translations";

const EVENTS_URL = "/data/events.json";
const MAX_CARDS = 6;

export default function EventsView() {
  const { t } = useLanguage();
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch(EVENTS_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventItem[]) => {
        if (cancelled) return;
        setUpcoming(getUpcomingEvents(data).slice(0, MAX_CARDS));
      })
      .catch(() => {
        if (!cancelled) setUpcoming([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-full w-full items-center justify-center overflow-visible px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1rem,3vh,2rem)]">
      <div className="flex w-full flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
        <div className="shrink-0 text-center">
          <h1 className="text-[clamp(1.4rem,2.8vw,1.95rem)] font-bold text-foreground">
            {t("events.pageTitle")}
          </h1>
          <p className="mt-1 text-[clamp(0.78rem,1.7vw,0.95rem)] text-muted">
            {t("events.pageSubtitle")}
          </p>
        </div>

        {upcoming.length === 0 ? (
          <div className="flex items-center justify-center">
            <p className="text-base text-muted">{t("events.empty")}</p>
          </div>
        ) : (
          <div className="grid min-h-0 auto-rows-max content-center grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.25rem)] sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, index) => (
              <div
                key={`${event.title}-${event.date}`}
                className={
                  // Below `sm` the grid is single-column, so more than 3 stacked
                  // full cards would overflow the no-scroll viewport — cap what's
                  // shown there; sm+ has room via 2-3 columns, so all render.
                  index >= 3 ? "hidden sm:block" : "block"
                }
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const { t, lang } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const imageUrl = eventImageUrl(event);

  return (
    <div className="h-[clamp(9rem,21vh,11rem)] [perspective:1200px] sm:h-[clamp(14rem,34vh,19rem)]">
      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: prefersReducedMotion ? "none" : "transform 0.55s cubic-bezier(0.4, 0.1, 0.2, 1)",
        }}
      >
        <EventCardFront event={event} imageUrl={imageUrl} lang={lang} onFlip={() => setFlipped(true)} />
        <EventCardBack event={event} t={t} onFlip={() => setFlipped(false)} />
      </div>
    </div>
  );
}

const GLASS_CARD_CLASSES =
  "absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl [backface-visibility:hidden]";

function EventCardFront({
  event,
  imageUrl,
  lang,
  onFlip,
}: {
  event: EventItem;
  imageUrl: string;
  lang: Lang;
  onFlip: () => void;
}) {
  const { t } = useLanguage();

  return (
    <article className={GLASS_CARD_CLASSES}>
      <img src={imageUrl} alt="" className="h-[42%] w-full shrink-0 object-cover" />
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-[clamp(0.5rem,1.2vw,0.85rem)]">
        <span className="text-[clamp(0.62rem,1.1vw,0.76rem)] font-medium text-[rgb(var(--accent-text-rgb))]">
          {formatEventDate(event.date, lang)}
        </span>
        <h3 className="truncate text-[clamp(0.84rem,1.35vw,1rem)] font-semibold text-foreground">
          {event.title}
        </h3>
        <p className="line-clamp-1 text-[clamp(0.67rem,1vw,0.81rem)] text-muted sm:line-clamp-2">
          {event.description}
        </p>
        <button
          type="button"
          onClick={onFlip}
          className="mt-auto self-start text-[clamp(0.67rem,1vw,0.81rem)] font-medium text-[rgb(var(--accent-text-rgb))] transition-opacity hover:opacity-80"
        >
          {t("events.viewMore")}
        </button>
      </div>
    </article>
  );
}

function EventCardBack({
  event,
  t,
  onFlip,
}: {
  event: EventItem;
  t: (key: TranslationKey) => string;
  onFlip: () => void;
}) {
  return (
    <article
      className={GLASS_CARD_CLASSES + " p-[clamp(0.6rem,1.4vw,1rem)]"}
      style={{ transform: "rotateY(180deg)" }}
    >
      <button
        type="button"
        onClick={onFlip}
        aria-label={t("events.back.backLabel")}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-background/60 text-muted transition-colors hover:text-[rgb(var(--accent-text-rgb))]"
      >
        <CloseIcon className="h-3 w-3" />
      </button>

      <h3 className="pe-6 text-[clamp(0.84rem,1.35vw,1rem)] font-semibold text-foreground">
        {event.title}
      </h3>
      <p className="mt-1 line-clamp-3 flex-1 text-[clamp(0.67rem,1vw,0.81rem)] leading-snug text-muted">
        {event.description} {t("events.back.moreInfo")}
      </p>
      <dl className="mt-1 flex flex-col gap-0.5 text-[clamp(0.65rem,0.95vw,0.78rem)]">
        <div className="flex gap-1">
          <dt className="shrink-0 font-medium text-[rgb(var(--accent-text-rgb))]">{t("events.back.timeLabel")}:</dt>
          <dd className="truncate text-muted">{t("events.back.timeValue")}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 font-medium text-[rgb(var(--accent-text-rgb))]">{t("events.back.locationLabel")}:</dt>
          <dd className="truncate text-muted">{t("events.back.locationValue")}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 font-medium text-[rgb(var(--accent-text-rgb))]">{t("events.back.organizerLabel")}:</dt>
          <dd className="truncate text-muted">{t("events.back.organizerValue")}</dd>
        </div>
      </dl>
    </article>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
