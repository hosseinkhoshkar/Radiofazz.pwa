"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type View = "home" | "schedule" | "events" | "contact";

interface ViewContextValue {
  view: View;
  setView: (view: View) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("home");

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return ctx;
}
