"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useView } from "./context/ViewContext";
import HomeView from "./components/views/HomeView";
import AboutView from "./components/views/AboutView";
import EventsView from "./components/views/EventsView";
import ContactView from "./components/views/ContactView";
import InstallAppView from "./components/views/InstallAppView";
import PrivacyView from "./components/views/PrivacyView";

const viewComponents = {
  home: HomeView,
  about: AboutView,
  events: EventsView,
  contact: ContactView,
  install: InstallAppView,
  privacy: PrivacyView,
} as const;

// View switching happens only via explicit clicks on the sidebar/hamburger
// nav items (see Sidebar.tsx / MobileMenu.tsx) — no wheel or swipe gesture
// triggers a view change, on any breakpoint. This container's own
// overflow-y-auto is ordinary content scrolling, nothing more: a view whose
// content is taller than the viewport (Contact, Install App, Privacy
// Policy, ...) just scrolls, on desktop now too, not only mobile.
export default function Home() {
  const { view } = useView();
  const ActiveView = viewComponents[view];
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="h-full w-full overflow-y-auto overscroll-y-contain">
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
          // (percentage/flex sizing needs a definite height up the chain) —
          // unrelated to the old scroll-nav system, purely a layout fit for
          // that constrained viewport, so it stays.
          className="min-h-full w-full pb-[var(--mini-player-height)] [@media(orientation:landscape)_and_(max-height:500px)]:h-full"
        >
          <ActiveView />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
