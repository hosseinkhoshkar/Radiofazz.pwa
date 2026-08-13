export type RGB = [number, number, number];

export interface AccentPalette {
  name: string;
  from: string;
  to: string;
  // Page-background tint for this palette — near-black, hue-matched, always
  // blending down into the same base darkness (bgTo). A tint shift, not a
  // lightness change: max channel value stays ~17/255, so contrast against
  // --foreground/--muted text is effectively unaffected.
  bgFrom: string;
  bgTo: string;
  // `from`, lightness-floored just enough (same hue/sat) to clear WCAG AA's
  // 4.5:1 normal-text minimum against both --background and
  // --background-elevated — needed because this is used for small/normal
  // body-size text throughout (nav hover states, card labels, badges), not
  // just large headings where the lower 3:1 large-text bar would apply.
  // `from`/`to` themselves stay at their literal deep/vivid values for
  // glows, borders, gradients, and pill backgrounds, where that depth is
  // the point and strict text contrast doesn't apply.
  textFrom: string;
  // Which fixed text color (near-black or near-white) reads best against
  // this palette's from->to gradient — used where the accent IS the full
  // background (PlayButton) rather than a tint/text color on top of the
  // page's near-black. Snapped instantly on palette change, never
  // crossfaded (avoids a muddy gray mid-fade between two fixed endpoints).
  onAccent: string;
}

// 9 curated two-color gradients — deep teal drifting into rich
// magenta/pink jewel tones. One is assigned deterministically per track/ad
// below, never sampled from the artwork itself. Several of the source hues
// (see git history for the original literal request) are dark enough that
// using them directly as text would fail contrast against the near-black
// page background — textFrom/onAccent above exist specifically to carry
// that adjustment without touching the deep `from`/`to` identity everything
// else (glows, borders, gradients) still uses.
//
// Was 10; "near-black-plum" (from #2B0D24) was removed — it hashed to the
// palette assigned to "Shahram K::Dokhtar Bandari" (the track playing when
// this was reported) and was the darkest/lowest-contrast entry of the set,
// the one that needed the most textFrom/onAccent correction to begin with.
export const ACCENT_PALETTES: AccentPalette[] = [
  { name: "deep-teal", from: "#0D4D57", to: "#125c94", bgFrom: "#030f11", bgTo: "#06060c", textFrom: "#17899a", onAccent: "#f5f3ff" },
  { name: "teal", from: "#157A7E", to: "#1a85bb", bgFrom: "#031011", bgTo: "#06060c", textFrom: "#188a8e", onAccent: "#f5f3ff" },
  { name: "bright-teal", from: "#1FA3A3", to: "#28a6dc", bgFrom: "#031111", bgTo: "#06060c", textFrom: "#1FA3A3", onAccent: "#06060c" },
  { name: "plum-magenta", from: "#6B2D5E", to: "#9e3c6c", bgFrom: "#11070f", bgTo: "#06060c", textFrom: "#b959a5", onAccent: "#f5f3ff" },
  { name: "magenta-pink", from: "#8E1E63", to: "#ca2559", bgFrom: "#11040c", bgTo: "#06060c", textFrom: "#d63e9c", onAccent: "#f5f3ff" },
  { name: "pink-magenta", from: "#B72B7A", to: "#da4a70", bgFrom: "#11040b", bgTo: "#06060c", textFrom: "#d34495", onAccent: "#f5f3ff" },
  { name: "hot-pink", from: "#D63384", to: "#e5677f", bgFrom: "#11040a", bgTo: "#06060c", textFrom: "#d93f8c", onAccent: "#06060c" },
  { name: "rose-pink", from: "#E7478E", to: "#f17f8f", bgFrom: "#11050a", bgTo: "#06060c", textFrom: "#E7478E", onAccent: "#06060c" },
  { name: "deep-magenta", from: "#7B0F4F", to: "#ba1243", bgFrom: "#11020b", bgTo: "#06060c", textFrom: "#e52697", onAccent: "#f5f3ff" },
];

/**
 * Small, fast, deterministic string hash — sum of char codes mod palette
 * count. Already reads ACCENT_PALETTES.length dynamically rather than a
 * hardcoded 10, so shrinking the array to 9 needed no change here: for any
 * positive N, `sum % N` is always in [0, N-1] — out-of-bounds is
 * mathematically impossible regardless of array length.
 */
export function pickPalette(key: string): AccentPalette {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return ACCENT_PALETTES[sum % ACCENT_PALETTES.length];
}

export function hexToRgb(hex: string): RGB {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
