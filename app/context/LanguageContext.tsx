"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGS, translations, type Lang, type TranslationKey } from "@/lib/i18n/translations";

type Dir = "rtl" | "ltr";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: Dir;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function dirFor(lang: Lang): Dir {
  return lang === "fa" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored && LANGS.includes(stored as Lang)) {
      setLangState(stored as Lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dirFor(lang));
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem("lang", next);
  }

  function t(key: TranslationKey): string {
    return translations[lang][key];
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir: dirFor(lang), t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
