// Thin wrapper around gtag.js. Deliberately has no consent check of its
// own — `window.gtag` only exists once GoogleAnalytics.tsx has actually
// mounted the GA4 script, which it only does post-consent (see
// ConsentContext.tsx). That makes every call site here safe to fire
// unconditionally: pre-consent, mid-session before the script has loaded,
// or with no NEXT_PUBLIC_GA_MEASUREMENT_ID configured at all, this is a
// silent no-op rather than a scattered "if (hasConsented)" check at every
// call site (and, unlike a scattered check, it can't be gotten wrong once
// and quietly send data before consent).
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

// GA4's own automatic pageview is disabled (send_page_view: false in
// GoogleAnalytics.tsx) since there's no real navigation for it to hook
// into here — this fires the equivalent manually on every view switch.
export function trackPageView(viewName: string): void {
  trackEvent("page_view", {
    page_title: viewName,
    page_path: `/${viewName}`,
  });
}
