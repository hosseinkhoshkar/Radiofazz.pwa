"use client";

import Script from "next/script";
import { useConsent } from "../context/ConsentContext";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Renders nothing — no script tag, no dataLayer, no cookie — until BOTH:
// a Measurement ID is actually configured, and the user has accepted the
// cookie consent banner (see ConsentContext.tsx). hasConsented starts
// false on every load and only flips true after localStorage is read on
// mount or the accept button fires grantConsent(), so there's no window
// where this can render the scripts before consent — verified by loading
// the site with localStorage cleared and checking the Network tab: no
// requests to googletagmanager.com/google-analytics.com until "accept" is
// clicked.
export default function GoogleAnalytics() {
  const { hasConsented } = useConsent();

  if (!GA_MEASUREMENT_ID || !hasConsented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
