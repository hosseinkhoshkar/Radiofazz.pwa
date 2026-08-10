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
  }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
  };
  User: {
    PushSubscription: {
      id: string | null | undefined;
      optedIn: boolean;
      addEventListener: (
        event: "change",
        listener: (event: { current: { id: string | null | undefined; optedIn: boolean } }) => void
      ) => void;
      removeEventListener: (
        event: "change",
        listener: (event: { current: { id: string | null | undefined; optedIn: boolean } }) => void
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
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          // Points at the app's own service worker (public/sw.js), which
          // importScripts()'s the OneSignal worker in — see that file.
          serviceWorkerPath: "sw.js",
          serviceWorkerParam: { scope: "/" },
        });
        // TEMPORARY DEBUG LOGGING — remove once the subscription flow is
        // confirmed end-to-end.
        console.log("[OneSignal debug] init() resolved");
      } catch (err) {
        console.error("[OneSignal debug] init() failed:", err);
      }
    });
  }, []);

  function requestPermission() {
    if (!ONESIGNAL_APP_ID || !window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        setStatus(Notification.permission as PermissionStatus);

        // TEMPORARY DEBUG LOGGING — remove once the subscription flow is
        // confirmed end-to-end. Notification.permission === "granted" only
        // means the browser-level prompt was accepted; it says nothing about
        // whether OneSignal's servers actually issued a subscription id.
        console.log("[OneSignal debug] browser Notification.permission:", Notification.permission);
        console.log("[OneSignal debug] PushSubscription immediately after requestPermission:", {
          id: OneSignal.User.PushSubscription.id,
          optedIn: OneSignal.User.PushSubscription.optedIn,
        });

        OneSignal.User.PushSubscription.addEventListener("change", (event) => {
          console.log("[OneSignal debug] PushSubscription change event:", event.current);
        });
      } catch (err) {
        console.error("[OneSignal debug] requestPermission/subscription failed:", err);
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
