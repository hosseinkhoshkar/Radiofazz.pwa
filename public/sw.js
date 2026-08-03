const CACHE_NAME = "radiofaaz-shell-v1";

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

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
