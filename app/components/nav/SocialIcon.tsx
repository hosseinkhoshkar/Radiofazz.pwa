"use client";

import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import type { SocialLinkEntry } from "./socialLinks";

// Renders one entry from `socialLinks`: a real external link, or — when
// `url` is omitted (e.g. YouTube, not live yet) — a dimmed, disabled control
// that shows a "Coming soon" label on hover (desktop) or tap (mobile, since
// touch has no hover to rely on).
export default function SocialIcon({ icon: Icon, url, labelKey, color, platform }: SocialLinkEntry) {
  const { t } = useLanguage();
  const [tapped, setTapped] = useState(false);
  const label = t(labelKey);

  if (!url) {
    return (
      <span className="group relative inline-flex">
        <button
          type="button"
          disabled
          aria-label={label}
          title={label}
          onClick={() => setTapped((prev) => !prev)}
          // Still recolored to its real brand color (YouTube red) — only the
          // opacity/cursor/disabled state signals "not live yet", not a
          // washed-out monochrome icon.
          style={{ color }}
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full opacity-40"
        >
          <Icon className="h-5 w-5" />
        </button>
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-background-elevated px-2 py-1 text-[11px] text-foreground shadow-lg transition-opacity ${
            tapped ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{ color }}
      onClick={() => trackEvent("social_click", { platform })}
      className="flex h-11 w-11 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}
