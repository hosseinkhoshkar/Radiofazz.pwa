import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radio Faaz",
    short_name: "Radio Faaz",
    description: "Radio Faaz — 24/7 Persian and Iranian internet radio broadcasting live from Hamburg",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    background_color: "#05010f",
    // Fixed black (matches --background in globals.css) — the Android
    // status/task-switcher bar this drives must never shift with the
    // per-track accent palette, unlike everything else that intentionally
    // crossfades with it.
    theme_color: "#06060c",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
