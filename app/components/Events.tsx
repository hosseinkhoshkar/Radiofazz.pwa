"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";

const EVENTS_URL = "/data/events.json";

interface EventItem {
  title: string;
  date: string;
  description: string;
  image?: string;
  link?: string;
}

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" });

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch(EVENTS_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EventItem[]) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (events.length === 0) return null;

  const now = Date.now();
  const upcoming = events
    .filter((event) => new Date(event.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events
    .filter((event) => new Date(event.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6">
      {upcoming.length > 0 && (
        <EventGroup title="رویدادهای پیش رو" events={upcoming} />
      )}
      {past.length > 0 && <EventGroup title="رویدادهای گذشته" events={past} />}
    </div>
  );
}

function EventGroup({ title, events }: { title: string; events: EventItem[] }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-bold text-foreground">{title}</h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-5 sm:grid-cols-2"
      >
        {events.map((event) => (
          <motion.article
            key={`${event.title}-${event.date}`}
            variants={cardVariants}
            className="flex flex-col overflow-hidden rounded-2xl border border-neon-purple/20 bg-background-elevated"
          >
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="h-36 w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-xs text-neon-cyan">
                {dateFormatter.format(new Date(event.date))}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                {event.title}
              </h3>
              <p className="flex-1 text-sm text-muted">{event.description}</p>
              {event.link && (
                <a
                  href={event.link}
                  className="mt-2 text-sm font-medium text-neon-pink transition-colors hover:text-neon-cyan"
                >
                  مشاهده بیشتر ←
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
