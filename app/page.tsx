"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type TouchEvent, type WheelEvent } from "react";
import { useView, type View } from "./context/ViewContext";
import { trackPageView } from "@/lib/analytics";
import HomeView from "./components/views/HomeView";
import AboutView from "./components/views/AboutView";
import EventsView from "./components/views/EventsView";
import ContactView from "./components/views/ContactView";
import InstallAppView from "./components/views/InstallAppView";
import PrivacyView from "./components/views/PrivacyView";
import { navItems } from "./components/nav/navItems";
import { useIsMobileViewport } from "@/lib/useIsMobileViewport";

const viewComponents = {
  home: HomeView,
  about: AboutView,
  events: EventsView,
  contact: ContactView,
  install: InstallAppView,
  privacy: PrivacyView,
} as const;

// Scroll/swipe navigation follows the same order as the sidebar/tab bar.
const VIEW_ORDER: View[] = navItems.map((item) => item.view);

// Elements with their own native wheel behavior — don't hijack scroll there.
const SCROLLABLE_SELECTOR = "textarea, select, input";

// Doubled from 60 — the original threshold fired on small/accidental
// scroll input; debounce/cooldown timing and the transition animation
// below are untouched, only how big a gesture has to be to trigger at all.
const WHEEL_DELTA_THRESHOLD = 120;
const WHEEL_ACCUMULATOR_RESET_MS = 150;
const SWIPE_DISTANCE_THRESHOLD = 120;
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

  // Virtual pageview per view switch (sidebar/tab click, scroll/swipe, or
  // any other path — all of them funnel through this same `view` state, so
  // one effect here covers every trigger). No real route change exists for
  // GA4's own automatic pageview to hook into in this single-page app; see
  // GoogleAnalytics.tsx for why that's disabled in favor of this. No-ops
  // entirely pre-consent/pre-GA-load (see lib/analytics.ts).
  useEffect(() => {
    trackPageView(view);
  }, [view]);

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
  // internally, so there's no "edge" to gate this behind. Privacy Policy is
  // the one exception: its own section list scrolls internally (see
  // PrivacyView.tsx), so wheel input there must stay plain scrolling and
  // never trigger navigation — reachable/leavable only via nav clicks.
  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (view === "privacy" || isMobile || targetIsScrollable(event.target) || lockedRef.current)
      return;

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
    touchStartYRef.current =
      view === "privacy" || targetIsScrollable(event.target)
        ? null
        : (event.touches[0]?.clientY ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (view === "privacy" || startY == null || lockedRef.current) return;

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
          // Phone-landscape gets the same real h-full as md+ (not just
          // min-h-full) — a prerequisite for HomeView's hero to flex-1
          // expand into the space freed by hiding the three-card row there
          // (percentage/flex sizing needs a definite height up the chain).
          // Harmless for every other view: their own containers still only
          // switch to a hard md:overflow-hidden clip at md+ widths, so at
          // narrower phone-landscape widths (e.g. 667x375) they simply gain
          // the same natural-centering benefit Home does, with the outer
          // page container's overflow-y-auto still there as a scroll
          // fallback if content ever needs more room than that.
          className="min-h-full w-full pb-[var(--mini-player-height)] [@media(orientation:landscape)_and_(max-height:500px)]:h-full md:h-full"
        >
          <ActiveView />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
