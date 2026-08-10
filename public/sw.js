// Merges the OneSignal push worker into this app-shell worker (rather than
// registering a second worker at the same "/" scope, which the browser
// would treat as competing controllers) — see NotificationsContext.tsx,
// which points OneSignal's init at this file via serviceWorkerPath.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js");

const CACHE_NAME = "radiofaaz-shell-v2";

// Requests that must always hit the network fresh: live now-playing
// metadata and the audio stream itself.
const BYPASS_PATTERNS = [/\/api\/nowplaying/, /radiofaaz\.com:8000\/radiofaaz/];

function shouldBypassCache(url) {
  return BYPASS_PATTERNS.some((pattern) => pattern.test(url));
}

function isAppShellRequest(request) {
  if (request.method !== "GET") return false;
  if (request.mode === "navigate") return true;
  return ["style", "script", "font", "image"].includes(request.destination);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (shouldBypassCache(request.url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (!isAppShellRequest(request)) {
    return;
  }

  // Network-first: the app shell changes often during active development, so
  // a stale cache-first response would silently serve an old build forever
  // (the browser has no reason to revalidate a "successful" cached response).
  // Cache is only a fallback for offline use.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw new Error("Offline and no cached response available");
      }
    })
  );
});
