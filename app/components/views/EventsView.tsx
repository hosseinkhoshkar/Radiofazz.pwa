"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { formatEventDate } from "@/lib/i18n/format";

const EVENTS_URL = "/data/events.json";
const PLACEHOLDER_IMAGE = "/events/event-placeholder.svg";
const MAX_CARDS = 6;

interface EventItem {
  title: string;
  date: string;
  description: string;
  image?: string;
  link?: string;
}

export default function EventsView() {
  const { t, lang } = useLanguage();
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch(EVENTS_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventItem[]) => {
        if (cancelled) return;

        const now = Date.now();
        const filtered = data
          .filter((event) => new Date(event.date).getTime() >= now)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, MAX_CARDS);

        setUpcoming(filtered);
      })
      .catch(() => {
        if (!cancelled) setUpcoming([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-[clamp(0.75rem,2vh,1.5rem)] overflow-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1rem,3vh,2rem)]">
      <div className="shrink-0 text-center">
        <h1 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-foreground">
          {t("events.pageTitle")}
        </h1>
        <p className="mt-1 text-[clamp(0.7rem,1.5vw,0.85rem)] text-muted">
          {t("events.pageSubtitle")}
        </p>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">{t("events.empty")}</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-max content-center grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.25rem)] sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <article
              key={`${event.title}-${event.date}`}
              className="flex min-h-0 flex-col self-center overflow-hidden rounded-2xl border border-foreground/10 bg-background-elevated/60 backdrop-blur-xl"
            >
              <img
                src={event.image ?? PLACEHOLDER_IMAGE}
                alt=""
                className="h-[clamp(4rem,12vh,7rem)] w-full shrink-0 object-cover"
              />
              <div className="flex min-h-0 flex-1 flex-col gap-1 p-[clamp(0.65rem,1.2vw,1rem)]">
                <span className="text-[clamp(0.6rem,1vw,0.7rem)] font-medium text-neon-cyan">
                  {formatEventDate(event.date, lang)}
                </span>
                <h3 className="truncate text-[clamp(0.8rem,1.2vw,0.95rem)] font-semibold text-foreground">
                  {event.title}
                </h3>
                <p className="line-clamp-2 text-[clamp(0.65rem,1vw,0.78rem)] text-muted">
                  {event.description}
                </p>
                {event.link && (
                  <a
                    href={event.link}
                    className="mt-1 text-[clamp(0.65rem,1vw,0.78rem)] font-medium text-neon-pink transition-colors hover:text-neon-cyan"
                  >
                    {t("events.viewMore")}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
