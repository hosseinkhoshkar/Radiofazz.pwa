"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { WEEKDAYS, type Lang } from "@/lib/i18n/translations";
import { localizeDigits } from "@/lib/i18n/format";

const SCHEDULE_URL = "/data/schedule.json";

interface Show {
  time: string;
  title: string;
  host: string;
}

interface DaySchedule {
  day: string;
  shows: Show[];
}

function todayIndex() {
  // JS getDay(): 0=Sunday..6=Saturday. Our week starts Saturday.
  return (new Date().getDay() + 1) % 7;
}

export default function ScheduleView() {
  const { t, lang } = useLanguage();
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(todayIndex);

  useEffect(() => {
    let cancelled = false;

    fetch(SCHEDULE_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DaySchedule[]) => {
        if (!cancelled) setSchedule(data);
      })
      .catch(() => {
        if (!cancelled) setSchedule([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-[clamp(0.75rem,2vh,1.5rem)] overflow-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1rem,3vh,2rem)]">
      <div className="shrink-0 text-center">
        <h1 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-foreground">
          {t("schedule.title")}
        </h1>
        <p className="mt-1 text-[clamp(0.7rem,1.5vw,0.85rem)] text-muted">
          {t("schedule.subtitle")}
        </p>
      </div>

      {/* Mobile: day tabs + single day list */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:hidden">
        <div className="flex shrink-0 gap-1.5 overflow-x-auto">
          {schedule.map((d, i) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setSelectedDay(i)}
              aria-current={selectedDay === i ? "true" : undefined}
              className={`min-h-11 min-w-11 shrink-0 rounded-full border px-3 text-[clamp(0.65rem,2.8vw,0.75rem)] font-medium whitespace-nowrap transition-colors ${
                selectedDay === i
                  ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                  : "border-foreground/10 bg-background-elevated/60 text-muted"
              }`}
            >
              {WEEKDAYS[lang][i]}
            </button>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-2">
          {schedule[selectedDay]?.shows.map((show) => (
            <ShowRow key={show.time + show.title} show={show} lang={lang} />
          ))}
        </div>
      </div>

      {/* Desktop: 7-column week grid */}
      <div className="hidden min-h-0 flex-1 grid-cols-7 gap-2 md:grid">
        {schedule.map((d, i) => (
          <div key={d.day} className="flex min-h-0 flex-col gap-2">
            <h2 className="shrink-0 text-center text-[clamp(0.8rem,1.1vw,0.95rem)] font-semibold text-foreground">
              {WEEKDAYS[lang][i]}
            </h2>
            <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-2">
              {d.shows.map((show) => (
                <ShowRow
                  key={show.time + show.title}
                  show={show}
                  lang={lang}
                  compact
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowRow({
  show,
  lang,
  compact,
}: {
  show: Show;
  lang: Lang;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-background-elevated/60 backdrop-blur-xl ${
        compact ? "px-[clamp(0.5rem,0.9vw,0.75rem)] py-[clamp(0.5rem,1.2vh,0.85rem)]" : "px-4 py-3"
      }`}
    >
      <span className="text-[clamp(0.6rem,1vw,0.7rem)] font-medium text-neon-cyan">
        {localizeDigits(show.time, lang)}
      </span>
      <span className="truncate text-[clamp(0.7rem,1.1vw,0.85rem)] font-semibold text-foreground">
        {show.title}
      </span>
      <span className="truncate text-[clamp(0.6rem,0.95vw,0.75rem)] text-muted">
        {show.host}
      </span>
    </div>
  );
}
