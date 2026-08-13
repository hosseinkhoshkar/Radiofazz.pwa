"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

// Not in lib.dom.d.ts — the browser API this event belongs to
// (beforeinstallprompt) is a Chromium/Android extension, never standardized.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type PromptResult = "accepted" | "dismissed" | "unavailable";

interface InstallPromptContextValue {
  // Non-null only once Chrome/Edge/Android has actually fired the event —
  // its mere presence is what the Install-App view uses to decide whether
  // to show a real "Install Now" button or the manual iOS-style steps.
  canPromptInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<PromptResult>;
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

// Mounted once at the root (see layout.tsx) specifically so this listener is
// attached from the very first paint — beforeinstallprompt fires at most
// once per page load and only if preventDefault() is called synchronously
// inside the handler; miss that window (e.g. by only wiring this up once the
// user navigates to the install view) and the browser's default mini-infobar
// fires instead and the event is gone for good, with no way to re-request it
// short of a full reload.
export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallEvent(null);
      // Single source of truth for "install completed" — fires for every
      // real install regardless of path (this app's own CTA, or the
      // browser's native install affordance), so it's tracked once here
      // rather than also at the CTA click site (see InstallAppView.tsx).
      trackEvent("pwa_installed");
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall(): Promise<PromptResult> {
    if (!installEvent) return "unavailable";

    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // Spent either way — Chrome only allows calling .prompt() once per
    // captured event, a fresh beforeinstallprompt won't fire again until
    // another full page load.
    setInstallEvent(null);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome;
  }

  return (
    <InstallPromptContext.Provider
      value={{ canPromptInstall: installEvent != null, isInstalled, promptInstall }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt() {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error("useInstallPrompt must be used within an InstallPromptProvider");
  }
  return ctx;
}
