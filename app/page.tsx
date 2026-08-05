"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, type TouchEvent, type WheelEvent } from "react";
import { useView, type View } from "./context/ViewContext";
import HomeView from "./components/views/HomeView";
import AboutView from "./components/views/AboutView";
import EventsView from "./components/views/EventsView";
import ContactView from "./components/views/ContactView";
import { navItems } from "./components/nav/navItems";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";

const viewComponents = {
  home: HomeView,
  about: AboutView,
  events: EventsView,
  contact: ContactView,
} as const;

// Scroll/swipe navigation follows the same order as the sidebar/tab bar.
const VIEW_ORDER: View[] = navItems.map((item) => item.view);

// Elements with their own native wheel behavior — don't hijack scroll there.
const SCROLLABLE_SELECTOR = "textarea, select, input";

const WHEEL_DELTA_THRESHOLD = 60;
const WHEEL_ACCUMULATOR_RESET_MS = 150;
const SWIPE_DISTANCE_THRESHOLD = 60;
// A full wheel/swipe gesture can keep emitting events for a few hundred ms;
// lock out further triggers for one gesture-and-transition cycle so a single
// scroll only ever changes the view once.
const NAV_COOLDOWN_MS = 800;
// Tolerance for "at the scroll edge" checks — real browsers can leave a
// sub-pixel remainder even when visually fully scrolled.
const EDGE_EPSILON_PX = 1;

function targetIsScrollable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(SCROLLABLE_SELECTOR) != null;
}

export default function Home() {
  const { view, setView } = useView();
  const ActiveView = viewComponents[view];
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobileViewport();

  const containerRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  function navigate(direction: 1 | -1, wrap: boolean) {
    if (lockedRef.current) return;

    const currentIndex = VIEW_ORDER.indexOf(view);
    let nextIndex = currentIndex + direction;

    if (wrap) {
      nextIndex = (nextIndex + VIEW_ORDER.length) % VIEW_ORDER.length;
    } else if (nextIndex < 0 || nextIndex >= VIEW_ORDER.length) {
      return;
    }

    lockedRef.current = true;
    setView(VIEW_ORDER[nextIndex]);
    setTimeout(() => {
      lockedRef.current = false;
    }, NAV_COOLDOWN_MS);
  }

  // Desktop wheel navigation — unchanged from the original feature: fires on
  // any accumulated scroll, no wrap-around. Desktop views never scroll
  // internally, so there's no "edge" to gate this behind.
  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (isMobile || targetIsScrollable(event.target) || lockedRef.current) return;

    wheelDeltaRef.current += event.deltaY;

    if (wheelResetTimerRef.current != null) clearTimeout(wheelResetTimerRef.current);
    wheelResetTimerRef.current = setTimeout(() => {
      wheelDeltaRef.current = 0;
    }, WHEEL_ACCUMULATOR_RESET_MS);

    if (wheelDeltaRef.current >= WHEEL_DELTA_THRESHOLD) {
      wheelDeltaRef.current = 0;
      navigate(1, false);
    } else if (wheelDeltaRef.current <= -WHEEL_DELTA_THRESHOLD) {
      wheelDeltaRef.current = 0;
      navigate(-1, false);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = targetIsScrollable(event.target)
      ? null
      : (event.touches[0]?.clientY ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY == null || lockedRef.current) return;

    const endY = event.changedTouches[0]?.clientY ?? startY;
    const delta = startY - endY;
    if (Math.abs(delta) < SWIPE_DISTANCE_THRESHOLD) return;

    if (!isMobile) {
      // Desktop-width viewport: unchanged — any swipe navigates, no wrap.
      navigate(delta > 0 ? 1 : -1, false);
      return;
    }

    // Mobile: the view itself scrolls now, so a swipe should only switch
    // views once already at the edge it's swiping past — mid-scroll swipes
    // just scroll normally (we never preventDefault, so that already
    // happens natively). Wraps around at both ends.
    const container = containerRef.current;
    const atTop = !container || container.scrollTop <= EDGE_EPSILON_PX;
    const atBottom =
      !container ||
      container.scrollTop + container.clientHeight >= container.scrollHeight - EDGE_EPSILON_PX;

    if (delta > 0 && atBottom) {
      navigate(1, true);
    } else if (delta < 0 && atTop) {
      navigate(-1, true);
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto overscroll-y-contain md:overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          // The mini-player is fixed and persistently visible on every view
          // (including Home) — reserve clearance for it here so it never
          // overlaps view content. The shared --mini-player-height var
          // (its own height + floating margin) is the entire offset
          // needed, same on every breakpoint — mobile no longer has a
          // separate bottom tab bar to additionally clear (see MobileMenu.tsx).
          className="min-h-full w-full pb-[var(--mini-player-height)] md:h-full"
        >
          <ActiveView />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
