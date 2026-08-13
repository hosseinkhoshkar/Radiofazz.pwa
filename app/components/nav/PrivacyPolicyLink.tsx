"use client";

import { useView } from "../../context/ViewContext";
import { useLanguage } from "../../context/LanguageContext";

// Small, unobtrusive footer link — rendered below the social icons row in
// both Sidebar.tsx (desktop) and MobileMenu.tsx (mobile drawer), same
// shared-component reasoning as Logo.tsx: one implementation so the two
// surfaces can't drift apart. Deliberately not in navItems.tsx — it's a
// footnote, not a primary nav destination, so it stays out of the main
// nav list.
export default function PrivacyPolicyLink({ onNavigate }: { onNavigate?: () => void }) {
  const { setView } = useView();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => {
        setView("privacy");
        onNavigate?.();
      }}
      className="text-[11px] text-muted/70 underline-offset-2 transition-colors hover:text-[rgb(var(--accent-text-rgb))] hover:underline"
    >
      {t("nav.privacyPolicy")}
    </button>
  );
}
