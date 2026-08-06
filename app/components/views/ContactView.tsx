"use client";

import ContactForm from "../ContactForm";
import { useLanguage } from "../../context/LanguageContext";
import { WhatsAppIcon } from "../nav/socialLinks";

export default function ContactView() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-[clamp(0.5rem,1.8vh,2rem)] overflow-visible px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.5vh,2rem)] md:h-full md:overflow-hidden">
      <div className="shrink-0 text-center">
        <h1 className="text-[clamp(1.4rem,2.8vw,1.68rem)] font-bold text-foreground">
          {t("contact.title")}
        </h1>
        <p className="mt-2 text-[clamp(0.84rem,1.7vw,0.98rem)] text-muted">
          {t("contact.subtitle")}
        </p>
        <p className="mt-2 text-[clamp(0.84rem,1.7vw,0.91rem)] leading-snug text-muted">
          {t("contact.about")}
        </p>
      </div>

      <a
        href="https://wa.me/4917666119999"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("contact.whatsapp.label")}
        className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-base font-semibold text-success transition-opacity hover:opacity-90"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t("contact.whatsapp.cta")}
      </a>

      <ContactForm />
    </div>
  );
}
