"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `md` breakpoint (768px) exactly — the same width the
// sidebar/bottom-tab-bar switch happens at, so "mobile" means the same
// thing everywhere in the app, not a separate touch-capability check.
const QUERY = "(max-width: 767.98px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True below the `md` breakpoint. Server/first-hydration snapshot is always
 * false so mismatched SSR output is never a concern (mirrors useFinePointer).
 */
export function useIsMobileViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
