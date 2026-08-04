export type Lang = "fa" | "en" | "de";

export const LANGS: Lang[] = ["fa", "en", "de"];

const fa = {
  "brand.name": "رادیو فاز",

  "nav.home": "خانه",
  "nav.schedule": "برنامه‌ها",
  "nav.events": "اطلاعیه‌ها",
  "nav.contact": "تماس با ما",
  "nav.languageLabel": "زبان",

  "theme.toggle": "تغییر پوسته روشن/تاریک",

  "player.play": "شروع پخش",
  "player.pause": "توقف پخش",
  "player.statusPlaying": "در حال پخش زنده",
  "player.statusLoading": "در حال اتصال...",
  "player.statusIdle": "برای شروع پخش لمس کنید",
  "player.volume": "میزان صدا",

  "events.upcomingTitle": "رویدادهای پیش رو",
  "events.viewAll": "مشاهده همه",
  "events.pageTitle": "رویدادهای پیش رو",
  "events.pageSubtitle": "تازه‌ترین رویدادها و برنامه‌های ویژه‌ی رادیو فاز",
  "events.empty": "در حال حاضر رویدادی ثبت نشده است.",
  "events.viewMore": "مشاهده بیشتر ←",

  "schedule.title": "برنامه هفتگی",
  "schedule.subtitle": "جدول پخش برنامه‌های رادیو فاز در طول هفته",

  "contact.title": "تماس با ما",
  "contact.subtitle": "سوال، پیشنهاد یا انتقادی دارید؟ پیام خود را برای ما بفرستید.",
  "contact.form.nameLabel": "نام",
  "contact.form.namePlaceholder": "نام شما",
  "contact.form.emailLabel": "ایمیل",
  "contact.form.messageLabel": "پیام",
  "contact.form.messagePlaceholder": "پیام خود را بنویسید...",
  "contact.form.submit": "ارسال پیام",
  "contact.form.submitting": "در حال ارسال...",
  "contact.form.success": "پیام شما با موفقیت ارسال شد. به‌زودی با شما تماس می‌گیریم.",
  "contact.form.error": "مشکلی در ارسال پیام پیش آمد. لطفاً دوباره تلاش کنید.",
  "contact.form.errors.name": "لطفاً نام خود را وارد کنید.",
  "contact.form.errors.email": "لطفاً ایمیل خود را وارد کنید.",
  "contact.form.errors.emailInvalid": "ایمیل واردشده معتبر نیست.",
  "contact.form.errors.message": "لطفاً پیام خود را بنویسید.",
  "contact.form.honeypotLabel": "وب‌سایت",
} as const;

export type TranslationKey = keyof typeof fa;
type Dictionary = Record<TranslationKey, string>;

const en: Dictionary = {
  "brand.name": "Radio Faaz",

  "nav.home": "Home",
  "nav.schedule": "Schedule",
  "nav.events": "Events",
  "nav.contact": "Contact",
  "nav.languageLabel": "Language",

  "theme.toggle": "Toggle light/dark theme",

  "player.play": "Start playback",
  "player.pause": "Stop playback",
  "player.statusPlaying": "Live now",
  "player.statusLoading": "Connecting…",
  "player.statusIdle": "Tap to start listening",
  "player.volume": "Volume",

  "events.upcomingTitle": "Upcoming Events",
  "events.viewAll": "View all",
  "events.pageTitle": "Upcoming Events",
  "events.pageSubtitle": "The latest events and special programs from Radio Faaz",
  "events.empty": "No events scheduled at the moment.",
  "events.viewMore": "Read more →",

  "schedule.title": "Weekly Schedule",
  "schedule.subtitle": "Radio Faaz's weekly broadcast schedule",

  "contact.title": "Contact Us",
  "contact.subtitle": "Have a question, suggestion, or feedback? Send us a message.",
  "contact.form.nameLabel": "Name",
  "contact.form.namePlaceholder": "Your name",
  "contact.form.emailLabel": "Email",
  "contact.form.messageLabel": "Message",
  "contact.form.messagePlaceholder": "Write your message…",
  "contact.form.submit": "Send Message",
  "contact.form.submitting": "Sending…",
  "contact.form.success": "Your message has been sent successfully. We'll be in touch soon.",
  "contact.form.error": "Something went wrong while sending your message. Please try again.",
  "contact.form.errors.name": "Please enter your name.",
  "contact.form.errors.email": "Please enter your email.",
  "contact.form.errors.emailInvalid": "Please enter a valid email address.",
  "contact.form.errors.message": "Please write your message.",
  "contact.form.honeypotLabel": "Website",
};

const de: Dictionary = {
  "brand.name": "Radio Faaz",

  "nav.home": "Startseite",
  "nav.schedule": "Sendeplan",
  "nav.events": "Veranstaltungen",
  "nav.contact": "Kontakt",
  "nav.languageLabel": "Sprache",

  "theme.toggle": "Hell-/Dunkelmodus umschalten",

  "player.play": "Wiedergabe starten",
  "player.pause": "Wiedergabe stoppen",
  "player.statusPlaying": "Jetzt live",
  "player.statusLoading": "Verbindung wird hergestellt…",
  "player.statusIdle": "Zum Abspielen tippen",
  "player.volume": "Lautstärke",

  "events.upcomingTitle": "Kommende Veranstaltungen",
  "events.viewAll": "Alle anzeigen",
  "events.pageTitle": "Kommende Veranstaltungen",
  "events.pageSubtitle": "Die neuesten Veranstaltungen und Sonderprogramme von Radio Faaz",
  "events.empty": "Derzeit sind keine Veranstaltungen geplant.",
  "events.viewMore": "Mehr erfahren →",

  "schedule.title": "Wochenprogramm",
  "schedule.subtitle": "Der wöchentliche Sendeplan von Radio Faaz",

  "contact.title": "Kontakt",
  "contact.subtitle": "Haben Sie eine Frage, einen Vorschlag oder Feedback? Schreiben Sie uns.",
  "contact.form.nameLabel": "Name",
  "contact.form.namePlaceholder": "Ihr Name",
  "contact.form.emailLabel": "E-Mail",
  "contact.form.messageLabel": "Nachricht",
  "contact.form.messagePlaceholder": "Schreiben Sie Ihre Nachricht…",
  "contact.form.submit": "Nachricht senden",
  "contact.form.submitting": "Wird gesendet…",
  "contact.form.success": "Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen.",
  "contact.form.error": "Beim Senden Ihrer Nachricht ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  "contact.form.errors.name": "Bitte geben Sie Ihren Namen ein.",
  "contact.form.errors.email": "Bitte geben Sie Ihre E-Mail-Adresse ein.",
  "contact.form.errors.emailInvalid": "Die eingegebene E-Mail-Adresse ist ungültig.",
  "contact.form.errors.message": "Bitte schreiben Sie Ihre Nachricht.",
  "contact.form.honeypotLabel": "Webseite",
};

export const translations: Record<Lang, Dictionary> = { fa, en, de };

// Weekday labels, ordered to match public/data/schedule.json (Saturday-first week).
export const WEEKDAYS: Record<Lang, string[]> = {
  fa: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"],
  en: [
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ],
  de: [
    "Samstag",
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
  ],
};
