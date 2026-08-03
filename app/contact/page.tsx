import type { Metadata } from "next";
import ContactForm from "../components/ContactForm";

export const metadata: Metadata = {
  title: "تماس با ما | رادیو فاز",
  description: "برای ارتباط با تیم رادیو فاز فرم زیر را تکمیل کنید.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">تماس با ما</h1>
        <p className="mt-2 text-sm text-muted">
          سوال، پیشنهاد یا انتقادی دارید؟ پیام خود را برای ما بفرستید.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
