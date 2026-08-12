"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Script from "next/script";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "";

type PermissionStatus = "unsupported" | "default" | "granted" | "denied";

interface NotificationsContextValue {
  status: PermissionStatus;
  requestPermission: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// Minimal typing for the slice of the OneSignal Web SDK v16 this app calls —
// the real SDK surface is much larger, no need to model all of it.
interface OneSignalSdk {
  init: (options: {
    appId: string;
    serviceWorkerPath?: string;
    serviceWorkerParam?: { scope: string };
    notifyButton?: { enable: boolean };
    welcomeNotification?: { icon?: string };
  }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
  };
  User: {
    PushSubscription: {
      id: string | null | undefined;
      token: string | null | undefined;
      optedIn: boolean;
      optIn: () => Promise<void>;
      addEventListener: (
        event: "change",
        listener: (event: {
          current: { id: string | null | undefined; token: string | null | undefined; optedIn: boolean };
        }) => void
      ) => void;
      removeEventListener: (
        event: "change",
        listener: (event: {
          current: { id: string | null | undefined; token: string | null | undefined; optedIn: boolean };
        }) => void
      ) => void;
    };
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

// Mounted once at the root (see layout.tsx), same reasoning as
// InstallPromptContext: the OneSignalDeferred queue and the browser's native
// Notification.permission are both global, so this only needs to be wired up
// once and shared, not re-initialized per consumer (Sidebar + MobileMenu).
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PermissionStatus>("unsupported");

  useEffect(() => {
    if (!("Notification" in window)) return;
    setStatus(Notification.permission as PermissionStatus);

    if (!ONESIGNAL_APP_ID) {
      console.warn("NEXT_PUBLIC_ONESIGNAL_APP_ID is not set — push notifications disabled.");
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        // Points at the app's own service worker (public/sw.js), which
        // importScripts()'s the OneSignal worker in — see that file. Without
        // this override, OneSignal registers a second worker at the same
        // "/" scope as sw.js, and the two fight over control.
        // welcomeNotification.icon avoids OneSignal falling back to a
        // nonexistent default icon (was 404ing) — reuses the PWA icon.
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: "sw.js",
          serviceWorkerParam: { scope: "/" },
          welcomeNotification: { icon: "/icons/icon-192.png" },
        });
      } catch (err) {
        console.error("[OneSignal] init() failed:", err);
      }
    });
  }, []);

  function requestPermission() {
    if (!ONESIGNAL_APP_ID || !window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        setStatus(Notification.permission as PermissionStatus);

        // Notification.permission === "granted" only means the browser-level
        // prompt was accepted — it does NOT create a subscription with
        // OneSignal's servers. That's a separate step (optIn()) which was
        // previously missing entirely, which is why the OneSignal dashboard
        // showed 0 subscribers despite the browser prompt working.
        if (Notification.permission === "granted") {
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (err) {
        console.error("[OneSignal] requestPermission/optIn failed:", err);
      }
    });
  }

  return (
    <NotificationsContext.Provider value={{ status, requestPermission }}>
      {ONESIGNAL_APP_ID && (
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
      )}
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
