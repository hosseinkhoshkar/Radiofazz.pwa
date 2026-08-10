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
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        // Points at the app's own service worker (public/sw.js), which
        // importScripts()'s the OneSignal worker in — see that file.
        serviceWorkerPath: "sw.js",
        serviceWorkerParam: { scope: "/" },
      });
    });
  }, []);

  function requestPermission() {
    if (!ONESIGNAL_APP_ID || !window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
      setStatus(Notification.permission as PermissionStatus);
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
