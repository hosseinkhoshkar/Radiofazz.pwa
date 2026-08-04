"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useView } from "./context/ViewContext";
import HomeView from "./components/views/HomeView";
import ScheduleView from "./components/views/ScheduleView";
import EventsView from "./components/views/EventsView";
import ContactView from "./components/views/ContactView";

const viewComponents = {
  home: HomeView,
  schedule: ScheduleView,
  events: EventsView,
  contact: ContactView,
} as const;

export default function Home() {
  const { view } = useView();
  const ActiveView = viewComponents[view];
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="h-full w-full"
      >
        <ActiveView />
      </motion.div>
    </AnimatePresence>
  );
}
