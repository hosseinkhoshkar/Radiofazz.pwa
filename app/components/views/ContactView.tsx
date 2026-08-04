"use client";

import ContactForm from "../ContactForm";
import { useLanguage } from "../../context/LanguageContext";

export default function ContactView() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2.5vh,2rem)]">
      <div className="shrink-0 text-center">
        <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold text-foreground">
          {t("contact.title")}
        </h1>
        <p className="mt-2 text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted">
          {t("contact.subtitle")}
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
