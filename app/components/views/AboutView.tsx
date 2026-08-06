"use client";

import { useLanguage } from "../../context/LanguageContext";

const AVATAR_PLACEHOLDER = "/dj-majid-placeholder.svg";
const DJ_MAJID_URL = "https://www.dj-majid.de";

export default function AboutView() {
  const { t } = useLanguage();

  const features = [
    { titleKey: "about.feature.hits.title", descKey: "about.feature.hits.desc" },
    { titleKey: "about.feature.classics.title", descKey: "about.feature.classics.desc" },
    { titleKey: "about.feature.nonstop.title", descKey: "about.feature.nonstop.desc" },
  ] as const;

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center gap-[clamp(0.5rem,1.8vh,1.5rem)] overflow-visible px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.5vh,1.5rem)] md:h-full md:overflow-hidden">
      <img
        src={AVATAR_PLACEHOLDER}
        alt={t("about.avatarAlt")}
        width={112}
        height={112}
        className="h-[clamp(4.5rem,14vh,7rem)] w-[clamp(4.5rem,14vh,7rem)] shrink-0 rounded-full border border-foreground/10 object-cover shadow-[0_0_40px_-10px_rgb(var(--accent-from-rgb)/50%)]"
      />

      <div className="shrink-0 text-center">
        <h1 className="text-[clamp(1.4rem,2.8vw,1.95rem)] font-bold text-foreground">
          {t("about.title")}
        </h1>
        <p className="mt-1 text-[clamp(0.78rem,1.7vw,0.95rem)] text-muted">
          {t("about.subtitle")}
        </p>
      </div>

      <p className="max-w-2xl shrink-0 text-center text-[clamp(0.84rem,1.7vw,0.98rem)] leading-snug text-muted">
        {t("about.bio")}
      </p>

      <a
        href={DJ_MAJID_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[clamp(0.84rem,1.7vw,0.98rem)] font-medium text-[rgb(var(--accent-text-rgb))] transition-opacity hover:opacity-80"
      >
        {t("about.linkCta")}
      </a>

      <div className="grid w-full max-w-3xl min-h-0 shrink grid-cols-1 gap-[clamp(0.5rem,1.5vw,1rem)] sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.titleKey}
            className="flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-background-elevated/60 px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1.2vh,1rem)] text-center backdrop-blur-xl"
          >
            <h2 className="text-[clamp(0.9rem,1.35vw,1rem)] font-semibold text-foreground">
              {t(feature.titleKey)}
            </h2>
            <p className="text-[clamp(0.73rem,1.1vw,0.84rem)] text-muted">
              {t(feature.descKey)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
