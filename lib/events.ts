export interface EventItem {
  title: string;
  date: string;
  description: string;
}

/** Future events only, soonest first — shared by the Events view and the Home teaser card. */
export function getUpcomingEvents(events: EventItem[]): EventItem[] {
  const now = Date.now();
  return events
    .filter((event) => new Date(event.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Same seeded-placeholder scheme the Events view uses, so the Home teaser
 * card for the next event shows the exact same image as that event's own
 * card does over in the Events view. */
export function eventImageUrl(event: EventItem): string {
  return `https://picsum.photos/seed/${slugify(`${event.title}-${event.date}`)}/600/400`;
}
