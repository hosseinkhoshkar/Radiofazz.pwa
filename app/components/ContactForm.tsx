"use client";

import emailjs from "@emailjs/browser";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useLanguage } from "../context/LanguageContext";
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

function validate(values: FormState, t: (key: TranslationKey) => string): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = t("contact.form.errors.name");
  }

  if (!values.email.trim()) {
    errors.email = t("contact.form.errors.email");
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = t("contact.form.errors.emailInvalid");
  }

  if (!values.message.trim()) {
    errors.message = t("contact.form.errors.message");
  }

  return errors;
}

export default function ContactForm() {
  const { t } = useLanguage();
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.website.trim()) {
      setForm(initialForm);
      setStatus("success");
      return;
    }

    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
      className="relative flex flex-col gap-[clamp(0.75rem,2vh,1.25rem)]"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm text-muted">
          {t("contact.form.nameLabel")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          disabled={isSending}
          placeholder={t("contact.form.namePlaceholder")}
          className="min-h-11 rounded-xl border border-neon-purple/30 bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-muted">
          {t("contact.form.emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          value={form.email}
          onChange={handleChange}
          disabled={isSending}
          placeholder="you@example.com"
          className="min-h-11 rounded-xl border border-neon-purple/30 bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-end text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm text-muted">
          {t("contact.form.messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          disabled={isSending}
          placeholder={t("contact.form.messagePlaceholder")}
          className="h-[clamp(4rem,14vh,7rem)] resize-none rounded-xl border border-neon-purple/30 bg-background px-4 py-[clamp(0.5rem,1.5vh,0.625rem)] text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.message && (
          <p className="text-xs text-danger">{errors.message}</p>
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

      <button
        type="submit"
        disabled={isSending}
        className="mt-2 rounded-xl bg-gradient-to-l from-neon-pink to-neon-purple px-6 py-3 font-semibold text-background transition-opacity disabled:opacity-60"
      >
        {isSending ? t("contact.form.submitting") : t("contact.form.submit")}
      </button>

      {status === "success" && (
        <p className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          {t("contact.form.success")}
        </p>
      )}
      {status === "error" && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("contact.form.error")}
        </p>
      )}
    </form>
  );
}
