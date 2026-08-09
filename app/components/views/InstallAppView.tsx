"use client";

import { useEffect, useState, type SVGProps } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useInstallPrompt } from "../../context/InstallPromptContext";
import type { TranslationKey } from "@/lib/i18n/translations";

type IconProps = SVGProps<SVGSVGElement>;
type Icon = (props: IconProps) => React.JSX.Element;

// iPadOS 13+ dropped "iPad" from its UA string and reports as a desktop Mac
// — the standard extra check is a "Mac" UA paired with touch support, which
// a real Mac never has.
function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

const BENEFITS: TranslationKey[] = [
  "install.benefit.offline",
  "install.benefit.homescreen",
  "install.benefit.appLike",
];

const ANDROID_STEPS: { key: TranslationKey; icon: Icon }[] = [
  { key: "install.android.step1", icon: MenuDotsIcon },
  { key: "install.android.step2", icon: PlusSquareIcon },
  { key: "install.android.step3", icon: CheckIcon },
];

const IOS_STEPS: { key: TranslationKey; icon: Icon }[] = [
  { key: "install.ios.step1", icon: ShareIcon },
  { key: "install.ios.step2", icon: PlusSquareIcon },
  { key: "install.ios.step3", icon: CheckIcon },
];

export default function InstallAppView() {
  const { t } = useLanguage();
  const { canPromptInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [isIOS, setIsIOS] = useState(false);
  const [outcome, setOutcome] = useState<"accepted" | "dismissed" | null>(null);

  // Client-only (navigator isn't available during SSR) — runs once on
  // mount, purely to pick which platform card gets the "Your device" badge.
  useEffect(() => {
    setIsIOS(isIosDevice());
  }, []);

  async function handleInstallClick() {
    const result = await promptInstall();
    if (result !== "unavailable") setOutcome(result);
  }

  const installed = isInstalled || outcome === "accepted";

  return (
    <div className="flex min-h-full w-full items-center justify-center overflow-visible px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.5vh,2rem)] md:h-full md:overflow-hidden">
      <div className="flex w-full max-w-2xl flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
        <div className="w-full shrink-0 text-center">
          <h1 className="text-[clamp(1.4rem,2.8vw,1.95rem)] font-bold text-foreground">
            {t("install.title")}
          </h1>
          <p className="mx-auto mt-2 w-full max-w-md text-[clamp(0.84rem,1.7vw,0.98rem)] leading-snug text-muted">
            {t("install.subtitle")}
          </p>
        </div>

        <ul className="mx-auto flex w-full max-w-md shrink-0 flex-col gap-1.5">
          {BENEFITS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 text-[clamp(0.78rem,1.45vw,0.91rem)] text-foreground/80"
            >
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-[rgb(var(--accent-text-rgb))]" />
              {t(key)}
            </li>
          ))}
        </ul>

        {/* Dynamic action: a real "Install Now" once Chrome/Edge/Android has
            actually captured a beforeinstallprompt event (see
            InstallPromptContext) and .prompt() is available to call, a
            confirmation once installed (either detected via
            display-mode:standalone on mount, or just accepted this session),
            or nothing at all — no button shown — when neither applies (iOS
            Safari, or a browser that never fires the event), since there's no
            working .prompt() to wire up there; those users rely entirely on
            the manual steps below instead. */}
        <div className="mx-auto w-full max-w-md shrink-0">
          {installed ? (
            <div className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/10 px-4 text-base font-semibold text-success">
              <CheckCircleIcon className="h-5 w-5" />
              {t("install.installedTitle")}
            </div>
          ) : canPromptInstall ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[rgb(var(--accent-from-rgb)/40%)] bg-[rgb(var(--accent-from-rgb)/15%)] px-4 text-base font-semibold text-foreground shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:bg-[rgb(var(--accent-from-rgb)/25%)]"
            >
              <DownloadIcon className="h-5 w-5" />
              {t("install.installNow")}
            </button>
          ) : null}

          {installed && (
            <p className="mt-1 text-center text-[clamp(0.73rem,1.35vw,0.84rem)] text-muted">
              {t("install.installedBody")}
            </p>
          )}
          {outcome === "dismissed" && (
            <p className="mt-2 text-center text-[clamp(0.73rem,1.35vw,0.84rem)] text-muted">
              {t("install.dismissedHint")}
            </p>
          )}
        </div>

        {/* Both platforms' manual steps are always shown — the "Your device"
            badge just highlights whichever one real-time detection thinks
            applies; the other stays visible as reference (e.g. installing on
            someone else's phone, or detection being wrong). */}
        <div className="grid w-full max-w-2xl min-h-0 shrink grid-cols-1 gap-[clamp(0.5rem,1.5vw,1rem)] sm:grid-cols-2">
          <PlatformCard titleKey="install.android.title" detected={!isIOS} steps={ANDROID_STEPS} />
          <PlatformCard titleKey="install.ios.title" detected={isIOS} steps={IOS_STEPS} />
        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  titleKey,
  detected,
  steps,
}: {
  titleKey: TranslationKey;
  detected: boolean;
  steps: { key: TranslationKey; icon: Icon }[];
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.6rem,1.3vh,1rem)] backdrop-blur-xl transition-colors ${
        detected
          ? "border-[rgb(var(--accent-from-rgb)/50%)] bg-[rgb(var(--accent-from-rgb)/10%)]"
          : "border-foreground/10 bg-background-elevated/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[clamp(0.9rem,1.35vw,1rem)] font-semibold text-foreground">
          {t(titleKey)}
        </h2>
        {detected && (
          <span className="shrink-0 rounded-full bg-[rgb(var(--accent-from-rgb))] px-2 py-0.5 text-[0.73rem] font-semibold text-white">
            {t("install.detectedBadge")}
          </span>
        )}
      </div>

      <ol className="flex flex-col gap-1.5">
        {steps.map(({ key, icon: StepIcon }, index) => (
          <li
            key={key}
            className="flex items-start gap-2 text-[clamp(0.73rem,1.25vw,0.84rem)] leading-snug text-muted"
          >
            <StepIcon className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--accent-text-rgb))]" />
            <span>
              {index + 1}. {t(key)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

// The iOS Safari "Share" glyph: a tray with an arrow pointing up out of it.
function ShareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function PlusSquareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

// Browser overflow menu ( ⋮ ) — filled dots read clearer at this size than
// an outlined version would.
function MenuDotsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}
