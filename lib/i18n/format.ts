import type { Lang } from "./translations";

export const LOCALE_MAP: Record<Lang, string> = {
  fa: "fa-IR",
  en: "en-US",
  de: "de-DE",
};

export function formatEventDate(date: string | Date, lang: Lang): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], { dateStyle: "medium" }).format(
    value
  );
}
