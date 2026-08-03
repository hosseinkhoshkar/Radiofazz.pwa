"use client";

import emailjs from "@emailjs/browser";
import { useState, type ChangeEvent, type FormEvent } from "react";

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

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "لطفاً نام خود را وارد کنید.";
  }

  if (!values.email.trim()) {
    errors.email = "لطفاً ایمیل خود را وارد کنید.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "ایمیل واردشده معتبر نیست.";
  }

  if (!values.message.trim()) {
    errors.message = "لطفاً پیام خود را بنویسید.";
  }

  return errors;
}

export default function ContactForm() {
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

    const validationErrors = validate(form);
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
      className="relative flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm text-muted">
          نام
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          disabled={isSending}
          placeholder="نام شما"
          className="rounded-xl border border-neon-purple/30 bg-background px-4 py-2.5 text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-muted">
          ایمیل
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
          className="rounded-xl border border-neon-purple/30 bg-background px-4 py-2.5 text-end text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm text-muted">
          پیام
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={form.message}
          onChange={handleChange}
          disabled={isSending}
          placeholder="پیام خود را بنویسید..."
          className="resize-none rounded-xl border border-neon-purple/30 bg-background px-4 py-2.5 text-foreground placeholder:text-muted/60 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
        />
        {errors.message && (
          <p className="text-xs text-danger">{errors.message}</p>
        )}
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">وب‌سایت</label>
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
        {isSending ? "در حال ارسال..." : "ارسال پیام"}
      </button>

      {status === "success" && (
        <p className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          پیام شما با موفقیت ارسال شد. به‌زودی با شما تماس می‌گیریم.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          مشکلی در ارسال پیام پیش آمد. لطفاً دوباره تلاش کنید.
        </p>
      )}
    </form>
  );
}
