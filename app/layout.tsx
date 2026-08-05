import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import Sidebar from "./components/nav/Sidebar";
import MobileMenu from "./components/nav/MobileMenu";
import LanguageSwitcher from "./components/nav/LanguageSwitcher";
import InstallAppButton from "./components/nav/InstallAppButton";
import MiniPlayer from "./components/MiniPlayer";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import GradientBlobs from "./components/effects/GradientBlobs";
import ParticleNetwork from "./components/effects/ParticleNetwork";
import { PlayerProvider } from "./context/PlayerContext";
import { ViewProvider } from "./context/ViewContext";
import { LanguageProvider } from "./context/LanguageContext";
import { InstallPromptProvider } from "./context/InstallPromptContext";
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
        <Script id="lang-init" strategy="beforeInteractive">
          {LANG_INIT_SCRIPT}
        </Script>
        <ServiceWorkerRegister />
        <GradientBlobs />
        <ParticleNetwork />
        <LanguageProvider>
          <ViewProvider>
          <InstallPromptProvider>
            <PlayerProvider>
              <Sidebar />
              {/* No more pb-16 mobile reservation — that used to clear the
                  bottom tab bar's own h-16, which is gone now (replaced by
                  MobileMenu's hamburger overlay). The mini-player's own
                  clearance is handled per-view via pb-[var(--mini-player-height)]
                  in page.tsx, unrelated to this wrapper. */}
              <div className="h-full lg:pl-60">
                <main className="relative h-full overflow-hidden">
                  {children}
                </main>
              </div>
              {/* Fixed top-right group — z-[60] keeps it above the mini-player
                  (z-50) and everything else. The hero's own content is
                  bottom-anchored within its card, so there's nothing near the
                  top of the viewport for this to collide with, on any view or
                  breakpoint. Desktop-only now: mobile has no room for a
                  floating Install button, and the language switcher moved
                  into MobileMenu's hamburger overlay instead. */}
              <div className="fixed top-4 right-12 z-[60] hidden items-center gap-2 sm:right-16 lg:flex">
                <InstallAppButton />
                <LanguageSwitcher />
              </div>
              <MiniPlayer />
              <MobileMenu />
            </PlayerProvider>
          </InstallPromptProvider>
          </ViewProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
