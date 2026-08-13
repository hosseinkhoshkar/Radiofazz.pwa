"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "consent-dismissed";

interface ConsentContextValue {
  // True once the user has clicked "accept" on ConsentBanner — either just
  // now (this session) or on a previous visit (read from localStorage on
  // mount). This is the single gate analytics loading is tied to: nothing
  // that sets cookies may initialize before this flips true. There's no
  // separate "declined" state — dismissing the banner IS accepting, the
  // same as before this context existed (see ConsentBanner.tsx); not
  // interacting with it at all leaves this false indefinitely.
  hasConsented: boolean;
  grantConsent: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    setHasConsented(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function grantConsent() {
    localStorage.setItem(STORAGE_KEY, "1");
    setHasConsented(true);
  }

  return (
    <ConsentContext.Provider value={{ hasConsented, grantConsent }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
