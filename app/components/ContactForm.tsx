"use client";

import emailjs from "@emailjs/browser";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useView } from "../context/ViewContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "";

type Status = "idle" | "sending" | "success" | "error";

interface FormState {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot — must stay empty for real users
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const initialForm: FormState = { name: "", email: "", message: "", website: "" };

function validateField(
  field: keyof FormErrors,
  values: FormState,
  t: (key: TranslationKey) => string
): string | undefined {
  switch (field) {
    case "name":
      return !values.name.trim() ? t("contact.form.errors.name") : undefined;
    case "email":
      if (!values.email.trim()) return t("contact.form.errors.email");
      if (!EMAIL_REGEX.test(values.email.trim())) return t("contact.form.errors.emailInvalid");
      return undefined;
    case "message":
      return !values.message.trim() ? t("contact.form.errors.message") : undefined;
    default:
      return undefined;
  }
}

function validate(values: FormState, t: (key: TranslationKey) => string): FormErrors {
  return {
    name: validateField("name", values, t),
    email: validateField("email", values, t),
    message: validateField("message", values, t),
  };
}

export default function ContactForm() {
  const { t } = useLanguage();
  const { setView } = useView();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status === "success" || status === "error") setStatus("idle");
  }

  function handleBlur(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const field = name as keyof FormErrors;
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, { ...form, [field]: value }, t),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.website.trim()) {
      setForm(initialForm);
      setStatus("success");
      return;
    }

    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return;

    setStatus("sending");

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          reply_to: form.email,
          message: form.message,
        },
        PUBLIC_KEY
      );
      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  }

  const isSending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative flex flex-col gap-[clamp(0.5rem,1.5vh,1.25rem)]"
    >
      <div className="flex flex-col gap-[clamp(0.25rem,0.8vh,0.375rem)]">
        <label htmlFor="name" className="text-[clamp(0.8rem,1.6vh,1rem)] text-muted">
          {t("contact.form.nameLabel")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSending}
          placeholder={t("contact.form.namePlaceholder")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="min-h-11 rounded-xl border border-[rgb(var(--accent-from-rgb)/30%)] bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-foreground placeholder:text-muted/60 focus:border-[rgb(var(--accent-from-rgb))] focus:outline-none disabled:opacity-50"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[clamp(0.25rem,0.8vh,0.375rem)]">
        <label htmlFor="email" className="text-[clamp(0.8rem,1.6vh,1rem)] text-muted">
          {t("contact.form.emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSending}
          placeholder={t("contact.form.emailPlaceholder")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="min-h-11 rounded-xl border border-[rgb(var(--accent-from-rgb)/30%)] bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-left text-foreground placeholder:text-muted/60 focus:border-[rgb(var(--accent-from-rgb))] focus:outline-none disabled:opacity-50"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-danger">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[clamp(0.25rem,0.8vh,0.375rem)]">
        <label htmlFor="message" className="text-[clamp(0.8rem,1.6vh,1rem)] text-muted">
          {t("contact.form.messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSending}
          placeholder={t("contact.form.messagePlaceholder")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="h-[clamp(2.75rem,11vh,6rem)] resize-none rounded-xl border border-[rgb(var(--accent-from-rgb)/30%)] bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-foreground placeholder:text-muted/60 focus:border-[rgb(var(--accent-from-rgb))] focus:outline-none disabled:opacity-50"
        />
        {errors.message && (
          <p id="message-error" role="alert" className="text-sm text-danger">
            {errors.message}
          </p>
        )}
      </div>

      <div
        aria-hidden="true"
        className="absolute -start-[9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">{t("contact.form.honeypotLabel")}</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={handleChange}
        />
      </div>

      <p className="text-[11px] leading-snug text-muted/70">
        {t("contact.privacyNoticeBefore")}
        <button
          type="button"
          onClick={() => setView("privacy")}
          className="underline underline-offset-2 hover:text-[rgb(var(--accent-text-rgb))]"
        >
          {t("nav.privacyPolicy")}
        </button>
        {t("contact.privacyNoticeAfter")}
      </p>

      <button
        type="submit"
        disabled={isSending}
        // Palette gradient + accent-on-rgb (not a hardcoded dark text
        // color) — same reasoning as PlayButton.tsx: some of the 10
        // palettes are dark enough that fixed dark text on the gradient
        // would fail contrast, so this picks whichever of near-black/
        // near-white reads best against the current palette.
        style={{
          backgroundImage: "linear-gradient(to left, rgb(var(--accent-from-rgb)), rgb(var(--accent-to-rgb)))",
        }}
        className="mt-[clamp(0.375rem,1vh,0.5rem)] rounded-xl px-6 py-3 font-semibold text-[rgb(var(--accent-on-rgb))] transition-opacity disabled:opacity-60"
      >
        {isSending ? t("contact.form.submitting") : t("contact.form.submit")}
      </button>

      {status === "success" && (
        <p
          role="status"
          className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-base text-success"
        >
          {t("contact.form.success")}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-base text-danger">
          {t("contact.form.error")}
        </p>
      )}
    </form>
  );
}
