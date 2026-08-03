import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "رادیو فاز",
  description: "رادیوی آنلاین فارسی — پخش زنده",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ServiceWorkerRegister />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
