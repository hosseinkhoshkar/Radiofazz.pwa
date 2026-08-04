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
        <p className="mt-3 text-[clamp(0.75rem,1.5vw,0.8125rem)] leading-relaxed text-muted">
          {t("contact.about")}
        </p>
      </div>

      <a
        href="https://wa.me/4917666119999"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("contact.whatsapp.label")}
        className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-semibold text-success transition-opacity hover:opacity-90"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t("contact.whatsapp.cta")}
      </a>

      <ContactForm />
    </div>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.87 9.87 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.07c-.24.68-1.4 1.3-1.93 1.36-.5.06-1 .26-3.34-.7-2.83-1.16-4.63-4.05-4.77-4.24-.14-.19-1.14-1.52-1.14-2.9 0-1.37.72-2.05.97-2.33.25-.28.55-.35.73-.35.19 0 .37 0 .53.01.17.01.4-.06.63.48.24.56.8 1.95.87 2.09.07.14.11.3.02.49-.09.19-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}
