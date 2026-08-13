import type { SVGProps } from "react";
import type { TranslationKey } from "@/lib/i18n/translations";

type IconProps = SVGProps<SVGSVGElement>;

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18 2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 0 -1 1v2h3a1 1 0 0 1 1 1.06l-.3 3a1 1 0 0 1 -.995 .94h-2.705v6a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-6h-2a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h2v-2a5 5 0 0 1 5 -5h3z" />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.5" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Also reused by ContactView's WhatsApp CTA — one glyph, one source of truth.
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.87 9.87 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.07c-.24.68-1.4 1.3-1.93 1.36-.5.06-1 .26-3.34-.7-2.83-1.16-4.63-4.05-4.77-4.24-.14-.19-1.14-1.52-1.14-2.9 0-1.37.72-2.05.97-2.33.25-.28.55-.35.73-.35.19 0 .37 0 .53.01.17.01.4-.06.63.48.24.56.8 1.95.87 2.09.07.14.11.3.02.49-.09.19-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z"
      />
    </svg>
  );
}

export interface SocialLinkEntry {
  icon: (props: IconProps) => React.JSX.Element;
  labelKey: TranslationKey;
  // Omitted for placeholder entries with nowhere to go yet (e.g. YouTube) —
  // consumers render those as an inert "coming soon" control instead of a
  // real link.
  url?: string;
  // Real brand color (hex) — SocialIcon applies this instead of the old
  // muted/monochrome + palette-accent-on-hover treatment, so each platform
  // reads as itself rather than all four looking identical. Instagram uses
  // one representative brand pink rather than a true multi-stop gradient
  // (its icon is a plain currentColor stroke shape, and this same icon
  // component is reused elsewhere expecting a single flat color).
  color: string;
  // Stable identifier for analytics (see SocialIcon.tsx) — separate from
  // labelKey since that's a translated, language-dependent string.
  platform: string;
}

// Add more entries here as the brand's presence grows — every consumer
// (sidebar, bottom nav, home card, SocialIcon) renders off this one array,
// so a new platform is a one-line addition, not a redesign.
export const socialLinks: SocialLinkEntry[] = [
  { icon: FacebookIcon, url: "https://www.facebook.com/RadioFaaz/", labelKey: "nav.socialFacebookLabel", color: "#1877F2", platform: "facebook" },
  { icon: InstagramIcon, url: "https://www.instagram.com/djmajid_official/", labelKey: "nav.socialInstagramLabel", color: "#E1306C", platform: "instagram" },
  { icon: WhatsAppIcon, url: "https://wa.me/4917666119999", labelKey: "contact.whatsapp.cta", color: "#25D366", platform: "whatsapp" },
  { icon: YouTubeIcon, labelKey: "nav.socialComingSoon", color: "#FF0000", platform: "youtube" },
];
