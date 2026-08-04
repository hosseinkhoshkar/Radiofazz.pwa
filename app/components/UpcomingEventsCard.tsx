"use client";

import { useEffect, useState } from "react";
import { useView } from "../context/ViewContext";
import { useLanguage } from "../context/LanguageContext";
import { formatEventDate } from "@/lib/i18n/format";

const EVENTS_URL = "/data/events.json";
const PLACEHOLDER_IMAGE = "/events/event-placeholder.svg";
const MAX_ITEMS = 3;

interface EventItem {
  title: string;
  date: string;
  description: string;
  image?: string;
  link?: string;
}

export default function UpcomingEventsCard() {
  const { setView } = useView();
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
          .slice(0, MAX_ITEMS);

        setUpcoming(filtered);
      })
      .catch(() => {
        if (!cancelled) setUpcoming([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (upcoming.length === 0) return null;

  return (
    <div className="flex w-full max-w-xs shrink flex-col gap-[clamp(0.75rem,2vh,1rem)] rounded-3xl border border-foreground/10 bg-background-elevated/60 p-[clamp(1rem,3vh,1.5rem)] backdrop-blur-xl">
      <h2 className="text-sm font-bold text-foreground">
        {t("events.upcomingTitle")}
      </h2>

      <ul className="flex flex-col gap-[clamp(0.5rem,1.5vh,0.75rem)]">
        {upcoming.map((event) => (
          <li
            key={`${event.title}-${event.date}`}
            className="flex items-center gap-3"
          >
            <img
              src={event.image ?? PLACEHOLDER_IMAGE}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {event.title}
              </p>
              <p className="text-xs text-neon-cyan">
                {formatEventDate(event.date, lang)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setView("events")}
        className="mt-1 min-h-11 rounded-full border border-neon-purple/20 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan"
      >
        {t("events.viewAll")}
      </button>
    </div>
  );
}
