import type { Lang } from "./translations";

export const LOCALE_MAP: Record<Lang, string> = {
  fa: "fa-IR",
  en: "en-US",
  de: "de-DE",
};

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts ASCII digits in a string (e.g. "08:00 - 10:00") to the target language's digit glyphs. */
export function localizeDigits(input: string, lang: Lang): string {
  if (lang !== "fa") return input;
  return input.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function formatEventDate(date: string | Date, lang: Lang): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], { dateStyle: "medium" }).format(
    value
  );
}
