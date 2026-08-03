import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radio Faaz",
    short_name: "Radio Faaz",
    description: "رادیوی آنلاین فارسی رادیو فاز — پخش زنده و بدون وقفه",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    background_color: "#05010f",
    theme_color: "#a855f7",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
