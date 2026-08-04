import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import Sidebar from "./components/nav/Sidebar";
import BottomNav from "./components/nav/BottomNav";
import MiniPlayer from "./components/MiniPlayer";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import GradientBlobs from "./components/effects/GradientBlobs";
import ParticleNetwork from "./components/effects/ParticleNetwork";
import { PlayerProvider } from "./context/PlayerContext";
import { ViewProvider } from "./context/ViewContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "رادیو فاز | Radio Faaz — Persian Hits & Classics",
  description:
    "رادیو فاز، رادیوی اینترنتی فارسی و ایرانی، ۲۴ ساعته از هامبورگ با اجرای دی‌جی مجید. Radio Faaz — 24/7 Persian & Iranian internet radio broadcasting from Hamburg since 2010, curated by DJ Majid. Persisches und iranisches Internetradio aus Hamburg.",
  keywords: [
    "رادیو فارسی",
    "رادیو ایرانی",
    "رادیو فاز",
    "پخش زنده رادیو",
    "دی‌جی مجید",
    "Persian radio",
    "Iranian radio",
    "Radio Faaz",
    "Persian music online",
    "persisches Radio",
    "iranisches Radio",
    "Radio Hamburg persisch",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "رادیو فاز",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
  colorScheme: "dark",
};

const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem("theme");
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
`;

const LANG_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem("lang");
    var lang = stored === "en" || stored === "de" || stored === "fa" ? stored : "en";
    document.documentElement.setAttribute("lang", lang);
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${vazirmatn.variable} h-[100dvh] overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="lang-init" strategy="beforeInteractive">
          {LANG_INIT_SCRIPT}
        </Script>
        <ServiceWorkerRegister />
        <GradientBlobs />
        <ParticleNetwork />
        <LanguageProvider>
          <ViewProvider>
            <PlayerProvider>
              <Sidebar />
              <div className="h-full pb-16 md:pb-0 md:pl-60">
                <main className="relative h-full overflow-hidden">
                  {children}
                </main>
              </div>
              <MiniPlayer />
              <BottomNav />
            </PlayerProvider>
          </ViewProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
