/**
 * Romanian / English UI strings. Calendar event titles stay in Romanian (source data).
 */

import { trackEvent } from "./analytics.js";

const STORAGE_KEY = "roc-calendar-lang";

/** @typedef {'ro' | 'en'} Lang */

/**
 * @param {string} tag BCP 47 language tag
 * @returns {boolean}
 */
function isRomanianLocale(tag) {
  const norm = String(tag).toLowerCase().replace("_", "-");
  return norm === "ro" || norm.startsWith("ro-");
}

/**
 * Romanian if the browser's preferred languages include Romanian (device locale).
 * @returns {Lang}
 */
export function detectPreferredLang() {
  const list =
    navigator.languages?.length > 0
      ? Array.from(navigator.languages)
      : [navigator.language || "en"];
  for (const tag of list) {
    if (isRomanianLocale(tag)) return "ro";
  }
  return "en";
}

/**
 * Saved choice wins; otherwise infer from browser languages.
 * @returns {Lang}
 */
export function resolveInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ro") return stored;
  } catch (_) {}
  return detectPreferredLang();
}

/** @type {Record<Lang, Record<string, string>>} */
const STRINGS = {
  ro: {
    "meta.title": "Calendar Ortodox Românesc",
    "meta.description":
      "Calendar ortodox românesc — sărbători, sfinți și posturi. Abonează-te la feedul iCalendar.",
    "meta.feedTitle": "Calendar Ortodox Românesc",
    "meta.keywords":
      "calendar ortodox, sarbatori ortodoxe, sfinti, post ortodox, pasti, craciun ortodox, calendar romania, icalendar, subscribe calendar",
    "brand.title": "Calendar Ortodox",
    "brand.sub": "Sfinți · sărbători · post — 12 luni",
    "nav.subscribe": "Abonează-te",
    "lang.label": "Limba",
    "theme.toDark": "Comută la tema întunecată",
    "theme.toLight": "Comută la tema deschisă",
    "lang.ro": "RO",
    "lang.en": "EN",
    "subscribe.eyebrow": "Pentru oricine",
    "subscribe.title": "Abonează-te la calendar",
    "subscribe.lede":
      "Un singur link — îl poți trimite prietenilor sau familiei. Calendarul se actualizează automat în fiecare lună (12 luni rulante).",
    "subscribe.feedLabel": "Link de abonare (feed iCalendar)",
    "subscribe.copy": "Copiază",
    "subscribe.feedHint": "Oricine cu acest link poate adăuga calendarul în aplicația preferată.",
    "subscribe.apple": "Apple Calendar",
    "subscribe.appleHint": "Mac, iPhone, iPad",
    "subscribe.google": "Google Calendar",
    "subscribe.googleHint": "Web & Android",
    "subscribe.outlook": "Outlook",
    "subscribe.outlookHint": "Web & desktop",
    "subscribe.download": "Descarcă .ics",
    "subscribe.downloadHint": "Import manual",
    "subscribe.copyWebcal": "Copiază link webcal",
    "subscribe.share": "Distribuie linkul",
    "subscribe.helpSummary": "Cum se abonează altcineva?",
    "subscribe.helpAppleTitle": "Apple Calendar",
    "subscribe.helpApple":
      "Apasă butonul de mai sus sau trimite linkul webcal. În Calendar: Fișier → Abonament calendar nou → lipește URL-ul.",
    "subscribe.helpGoogleTitle": "Google Calendar",
    "subscribe.helpGoogle":
      "Apasă „Google Calendar” sau în Google: Alte calendare → + → Din URL → lipește linkul .ics.",
    "subscribe.helpOutlookTitle": "Outlook",
    "subscribe.helpOutlook":
      "Apasă „Outlook” sau: Adaugă calendar → Abonare din web → lipește același link.",
    "subscribe.helpShareTitle": "Partajare",
    "subscribe.helpShare":
      "Copiază linkul și trimite-l pe WhatsApp, e-mail sau rețele sociale. Nu e nevoie de cont sau parolă.",
    "loader.text": "Se încarcă calendarul…",
    "error.title": "Nu s-a putut încărca",
    "error.retry": "Reîncearcă",
    "error.load": "Nu s-a putut încărca calendarul ({{status}})",
    "error.unknown": "Eroare necunoscută",
    "today.eyebrow": "Astăzi",
    "today.empty": "Nicio înregistrare pentru ziua de azi.",
    "cal.prev": "Luna anterioară",
    "cal.next": "Luna următoare",
    "cal.todayBtn": "Azi",
    "cal.gridLabel": "Calendar lunar",
    "cal.dayAria": "{{day}} {{month}} {{year}}, {{count}} evenimente",
    "legend.label": "Semnificația culorilor",
    "legend.major":
      '<strong>Roșu</strong> praznic mare <span class="legend-hint">Paști, Crăciun…</span>',
    "legend.feast": "<strong>Auriu</strong> sărbătoare",
    "legend.saint": "<strong>Verde</strong> sfântul zilei",
    "legend.fasting": "<strong>Mov</strong> post",
    "day.eyebrow": "Zi selectată",
    "day.pick": "Alege o zi din calendar.",
    "day.empty": "Nicio înregistrare pentru această zi.",
    "day.close": "Închide detaliile zilei",
    "months.eyebrow": "Luni disponibile",
    "months.lede": "12 luni rulante — apasă pentru a schimba calendarul",
    "months.sidebar": "Alege luna",
    "meta.events": "{{count}} evenimente în următoarele 12 luni",
    "footer.source":
      'Sursă: <a href="https://www.crestinortodox.ro/calendar-ortodox/" target="_blank" rel="noopener">CrestinOrtodox.ro</a>',
    "footer.tag": "Proiect personal",
    "footer.note":
      "Pet project făcut pentru mine — poate e util și altor techies care vor un calendar ortodox ca feed iCalendar.",
    "badge.major": "Praznic mare",
    "badge.feast": "Sărbătoare",
    "badge.fasting": "Post / dezlegare",
    "badge.saint": "Sfânt",
    "event.summary.post": "Post",
    "event.summary.harti": "Dezlegare la pește (Harti)",
    "event.summary.greatCanon": "Canonul Mare",
    "event.summary.dezlegareFish": "Dezlegare la pește",
    "event.summary.dezlegareOil": "Dezlegare la ulei și vin",
    "scrollTop.aria": "Înapoi sus — derulează la începutul paginii",
    "scrollTop.label": "Sus",
    "toast.copyFeed": "Link copiat — trimite-l oricui vrea să se aboneze",
    "toast.copyManual": "Selectează linkul și copiază manual (Cmd+C)",
    "toast.copyWebcal": "Link webcal copiat (potrivit pentru Apple)",
    "toast.shareFail": "Partajarea nu a reușit",
    "toast.shareText": "Abonează-te la calendarul ortodox — sărbători, sfinți și post.",
    "calendar.exportName": "Calendar Ortodox Românesc",
    "consent.title": "Cookie-uri și statistici",
    "consent.text":
      "Folosim cookie-uri și servicii (Google Analytics, Microsoft Clarity, opțional Plausible) pentru a înțelege cum este folosit site-ul. Calendarul funcționează fără accept. Poți schimba alegerea oricând.",
    "consent.accept": "Accept toate",
    "consent.reject": "Doar esențiale",
    "consent.settings": "Setări cookie",
    "consent.privacy": "Politica de confidențialitate",
    "footer.privacy": "Confidențialitate",
    "footer.privacyBtn": "Politica de confidențialitate",
    "privacy.meta.title": "Confidențialitate — Calendar Ortodox",
    "privacy.meta.description":
      "Politica de confidențialitate pentru Calendar Ortodox Românesc — statistici anonime despre utilizare și țară.",
    "privacy.eyebrow": "Confidențialitate",
    "privacy.title": "Politica de confidențialitate",
    "privacy.updated": "Actualizat: 3 iunie 2026",
    "privacy.intro":
      "Acest site este un calendar ortodox gratuit. Colectăm date de utilizare doar dacă accepți cookie-urile de analiză — ca să vedem câți oameni folosesc calendarul și din ce țări vin.",
    "privacy.backHome": "Înapoi la calendar",
    "privacy.who.title": "Cine operează site-ul",
    "privacy.who.text":
      "Acest site este un proiect personal open-source (pet project), fără conturi de utilizator. L-am construit pentru uz propriu — în special pentru techies care preferă un calendar ortodox ca feed iCalendar.",
    "privacy.why.title": "De ce colectăm date",
    "privacy.why.text":
      "Vrem să știm dacă site-ul este util: câți vizitatori îl folosesc, ce pagini deschid și din ce țări provin (aproximativ). Nu folosim datele pentru reclame și nu le vindem.",
    "privacy.what.title": "Ce date pot fi colectate (doar cu acceptul tău)",
    "privacy.what.1": "Pagini vizitate și acțiuni pe site (ex. lună selectată, zi, abonare la calendar)",
    "privacy.what.2": "Țară sau regiune aproximativă, tip de dispozitiv și browser",
    "privacy.what.3": "Limba interfeței (RO / EN)",
    "privacy.what.4": "Nu cerem nume, email sau parolă — site-ul nu are înregistrare",
    "privacy.providers.title": "Servicii folosite",
    "privacy.providers.text":
      "Dacă accepți „Accept toate”, putem folosi Google Analytics 4, Microsoft Clarity și, opțional, Plausible. Aceste servicii procesează date conform politicilor lor; datele pot fi stocate în SUA sau UE în funcție de furnizor.",
    "privacy.cookies.title": "Cookie-uri și stocare locală",
    "privacy.cookies.analytics":
      "Cookie-uri de analiză: doar după accept explicit (bannerul de la baza paginii).",
    "privacy.cookies.essential":
      "Fără analiză, păstrăm în browser doar preferința de limbă și alegerea ta privind cookie-urile (localStorage).",
    "privacy.retention.title": "Cât timp păstrăm datele",
    "privacy.retention.text":
      "Durata depinde de fiecare serviciu de analiză (de obicei câteva luni). Poți șterge cookie-urile din setările browserului oricând.",
    "privacy.rights.title": "Ce poți face",
    "privacy.rights.1": "Refuză analiza — apasă „Doar esențiale” în banner",
    "privacy.rights.2": "Schimbă alegerea — „Setări cookie” în subsol",
    "privacy.rights.3": "Șterge date locale — șterge cookie-urile și localStorage pentru acest site",
    "privacy.contact.title": "Contact",
    "privacy.contact.before": "Întrebări despre confidențialitate:",
    "privacy.contact.link": "deschide o discuție pe GitHub",
    "privacy.contact.after": "",
  },
  en: {
    "meta.title": "Romanian Orthodox Calendar",
    "meta.description":
      "Romanian Orthodox calendar — feasts, saints and fasting. Subscribe to the iCalendar feed.",
    "meta.feedTitle": "Romanian Orthodox Calendar",
    "meta.keywords":
      "orthodox calendar, romanian orthodox, saints calendar, fasting, easter orthodox, christmas orthodox, icalendar subscribe",
    "brand.title": "Orthodox Calendar",
    "brand.sub": "Saints · feasts · fasting — 12 months",
    "nav.subscribe": "Subscribe",
    "lang.label": "Language",
    "theme.toDark": "Switch to dark theme",
    "theme.toLight": "Switch to light theme",
    "lang.ro": "RO",
    "lang.en": "EN",
    "subscribe.eyebrow": "For everyone",
    "subscribe.title": "Subscribe to the calendar",
    "subscribe.lede":
      "One link you can share with friends or family. The calendar refreshes automatically every month (rolling 12 months).",
    "subscribe.feedLabel": "Subscription link (iCalendar feed)",
    "subscribe.copy": "Copy",
    "subscribe.feedHint": "Anyone with this link can add the calendar to their app.",
    "subscribe.apple": "Apple Calendar",
    "subscribe.appleHint": "Mac, iPhone, iPad",
    "subscribe.google": "Google Calendar",
    "subscribe.googleHint": "Web & Android",
    "subscribe.outlook": "Outlook",
    "subscribe.outlookHint": "Web & desktop",
    "subscribe.download": "Download .ics",
    "subscribe.downloadHint": "Manual import",
    "subscribe.copyWebcal": "Copy webcal link",
    "subscribe.share": "Share link",
    "subscribe.helpSummary": "How can someone else subscribe?",
    "subscribe.helpAppleTitle": "Apple Calendar",
    "subscribe.helpApple":
      "Tap the button above or send the webcal link. In Calendar: File → New Calendar Subscription → paste the URL.",
    "subscribe.helpGoogleTitle": "Google Calendar",
    "subscribe.helpGoogle":
      'Tap "Google Calendar" or in Google: Other calendars → + → From URL → paste the .ics link.',
    "subscribe.helpOutlookTitle": "Outlook",
    "subscribe.helpOutlook":
      'Tap "Outlook" or: Add calendar → Subscribe from web → paste the same link.',
    "subscribe.helpShareTitle": "Sharing",
    "subscribe.helpShare":
      "Copy the link and send it via WhatsApp, email or social media. No account or password needed.",
    "loader.text": "Loading calendar…",
    "error.title": "Could not load",
    "error.retry": "Try again",
    "error.load": "Could not load calendar ({{status}})",
    "error.unknown": "Unknown error",
    "today.eyebrow": "Today",
    "today.empty": "No entries for today.",
    "cal.prev": "Previous month",
    "cal.next": "Next month",
    "cal.todayBtn": "Today",
    "cal.gridLabel": "Month calendar",
    "cal.dayAria": "{{day}} {{month}} {{year}}, {{count}} events",
    "legend.label": "Color meaning",
    "legend.major":
      '<strong>Red</strong> major feast <span class="legend-hint">Easter, Christmas…</span>',
    "legend.feast": "<strong>Gold</strong> feast day",
    "legend.saint": "<strong>Green</strong> saint of the day",
    "legend.fasting": "<strong>Purple</strong> fasting",
    "day.eyebrow": "Selected day",
    "day.pick": "Pick a day on the calendar.",
    "day.empty": "No entries for this day.",
    "day.close": "Close day details",
    "months.eyebrow": "Available months",
    "months.lede": "Rolling 12 months — tap to change the calendar",
    "months.sidebar": "Choose month",
    "meta.events": "{{count}} events in the next 12 months",
    "footer.source":
      'Source: <a href="https://www.crestinortodox.ro/calendar-ortodox/" target="_blank" rel="noopener">CrestinOrtodox.ro</a>',
    "footer.tag": "Personal project",
    "footer.note":
      "A pet project I built for myself — it might be useful for other techies who want an Orthodox calendar as an iCalendar feed.",
    "badge.major": "Major feast",
    "badge.feast": "Feast",
    "badge.fasting": "Fasting / dispensation",
    "badge.saint": "Saint",
    "event.summary.post": "Fasting",
    "event.summary.harti": "Fast-free day",
    "event.summary.greatCanon": "Great Canon",
    "event.summary.dezlegareFish": "Fish allowed",
    "event.summary.dezlegareOil": "Dispensation for oil and wine",
    "scrollTop.aria": "Back to top — scroll to the start of the page",
    "scrollTop.label": "Top",
    "toast.copyFeed": "Link copied — share it with anyone who wants to subscribe",
    "toast.copyManual": "Select the link and copy manually (Cmd+C)",
    "toast.copyWebcal": "Webcal link copied (best for Apple Calendar)",
    "toast.shareFail": "Sharing failed",
    "toast.shareText": "Subscribe to the Orthodox calendar — feasts, saints and fasting.",
    "calendar.exportName": "Romanian Orthodox Calendar",
    "consent.title": "Cookies & analytics",
    "consent.text":
      "We use cookies and services (Google Analytics, Microsoft Clarity, optional Plausible) to understand how the site is used. The calendar works without accepting. You can change your choice anytime.",
    "consent.accept": "Accept all",
    "consent.reject": "Essential only",
    "consent.settings": "Cookie settings",
    "consent.privacy": "Privacy policy",
    "footer.privacy": "Privacy",
    "footer.privacyBtn": "Privacy policy",
    "privacy.meta.title": "Privacy — Orthodox Calendar",
    "privacy.meta.description":
      "Privacy policy for the Romanian Orthodox Calendar — anonymous usage and country statistics.",
    "privacy.eyebrow": "Privacy",
    "privacy.title": "Privacy policy",
    "privacy.updated": "Last updated: 3 June 2026",
    "privacy.intro":
      "This site is a free Orthodox calendar. We only collect usage data if you accept analytics cookies — to see how many people use the calendar and which countries they are from.",
    "privacy.backHome": "Back to calendar",
    "privacy.who.title": "Who runs this site",
    "privacy.who.text":
      "This site is a personal open-source pet project with no user accounts. I built it for my own use — mainly for techies who want an Orthodox calendar as an iCalendar feed.",
    "privacy.why.title": "Why we collect data",
    "privacy.why.text":
      "We want to know if the site is useful: how many visitors use it, which pages they open, and roughly where they are from. We do not use the data for ads and we do not sell it.",
    "privacy.what.title": "What may be collected (only with your consent)",
    "privacy.what.1": "Pages visited and actions on the site (e.g. month selected, day, calendar subscribe)",
    "privacy.what.2": "Approximate country or region, device and browser type",
    "privacy.what.3": "Interface language (RO / EN)",
    "privacy.what.4": "We do not ask for name, email or password — there is no sign-up",
    "privacy.providers.title": "Services we may use",
    "privacy.providers.text":
      "If you choose “Accept all”, we may use Google Analytics 4, Microsoft Clarity, and optionally Plausible. These providers process data under their own policies; data may be stored in the US or EU depending on the provider.",
    "privacy.cookies.title": "Cookies and local storage",
    "privacy.cookies.analytics":
      "Analytics cookies: only after you explicitly accept (banner at the bottom of the page).",
    "privacy.cookies.essential":
      "Without analytics, we only store your language preference and cookie choice in the browser (localStorage).",
    "privacy.retention.title": "How long we keep data",
    "privacy.retention.text":
      "Retention depends on each analytics service (usually a few months). You can delete cookies in your browser settings at any time.",
    "privacy.rights.title": "Your choices",
    "privacy.rights.1": "Refuse analytics — tap “Essential only” in the banner",
    "privacy.rights.2": "Change your choice — “Cookie settings” in the footer",
    "privacy.rights.3": "Delete local data — clear cookies and localStorage for this site",
    "privacy.contact.title": "Contact",
    "privacy.contact.before": "Privacy questions:",
    "privacy.contact.link": "open a discussion on GitHub",
    "privacy.contact.after": ".",
  },
};

const MONTH_KEYS = [
  "month.jan",
  "month.feb",
  "month.mar",
  "month.apr",
  "month.may",
  "month.jun",
  "month.jul",
  "month.aug",
  "month.sep",
  "month.oct",
  "month.nov",
  "month.dec",
];

// Month names embedded in ro/en blocks
STRINGS.ro["month.jan"] = "Ianuarie";
STRINGS.ro["month.feb"] = "Februarie";
STRINGS.ro["month.mar"] = "Martie";
STRINGS.ro["month.apr"] = "Aprilie";
STRINGS.ro["month.may"] = "Mai";
STRINGS.ro["month.jun"] = "Iunie";
STRINGS.ro["month.jul"] = "Iulie";
STRINGS.ro["month.aug"] = "August";
STRINGS.ro["month.sep"] = "Septembrie";
STRINGS.ro["month.oct"] = "Octombrie";
STRINGS.ro["month.nov"] = "Noiembrie";
STRINGS.ro["month.dec"] = "Decembrie";

STRINGS.en["month.jan"] = "January";
STRINGS.en["month.feb"] = "February";
STRINGS.en["month.mar"] = "March";
STRINGS.en["month.apr"] = "April";
STRINGS.en["month.may"] = "May";
STRINGS.en["month.jun"] = "June";
STRINGS.en["month.jul"] = "July";
STRINGS.en["month.aug"] = "August";
STRINGS.en["month.sep"] = "September";
STRINGS.en["month.oct"] = "October";
STRINGS.en["month.nov"] = "November";
STRINGS.en["month.dec"] = "December";

STRINGS.ro["weekday.mon"] = "Lu";
STRINGS.ro["weekday.tue"] = "Ma";
STRINGS.ro["weekday.wed"] = "Mi";
STRINGS.ro["weekday.thu"] = "Jo";
STRINGS.ro["weekday.fri"] = "Vi";
STRINGS.ro["weekday.sat"] = "Sâ";
STRINGS.ro["weekday.sun"] = "Du";

STRINGS.en["weekday.mon"] = "Mo";
STRINGS.en["weekday.tue"] = "Tu";
STRINGS.en["weekday.wed"] = "We";
STRINGS.en["weekday.thu"] = "Th";
STRINGS.en["weekday.fri"] = "Fr";
STRINGS.en["weekday.sat"] = "Sa";
STRINGS.en["weekday.sun"] = "Su";

/** @type {Lang} */
let currentLang = "en";

/** @type {Set<() => void>} */
const listeners = new Set();

/**
 * @returns {Lang}
 */
export function getLang() {
  return currentLang;
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function t(key, vars = {}) {
  let text = STRINGS[currentLang][key] ?? STRINGS.ro[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{{${k}}}`, String(v));
  }
  return text;
}

/**
 * @param {number} monthIndex 0–11
 */
export function getMonthName(monthIndex) {
  return t(MONTH_KEYS[monthIndex]);
}

export function getWeekdays() {
  return [
    t("weekday.mon"),
    t("weekday.tue"),
    t("weekday.wed"),
    t("weekday.thu"),
    t("weekday.fri"),
    t("weekday.sat"),
    t("weekday.sun"),
  ];
}

/**
 * @param {import('./event-kind.js').EventKind} kind
 */
export function getBadgeLabel(kind) {
  return t(`badge.${kind}`);
}

function updateMeta() {
  document.documentElement.lang = currentLang;
}

export function applyPageTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) el.innerHTML = t(key);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) el.setAttribute("aria-label", t(key));
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    btn.classList.toggle("lang-btn--active", lang === currentLang);
    btn.setAttribute("aria-pressed", lang === currentLang ? "true" : "false");
  });

  updateMeta();
}

/**
 * @param {Lang} lang
 */
export function setLanguage(lang) {
  if (lang !== "ro" && lang !== "en") return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyPageTranslations();
  listeners.forEach((fn) => fn());
  trackEvent("language_change", { lang });
  if (typeof window.gtag === "function") {
    window.gtag("set", "user_properties", { interface_language: lang });
  }
}

/**
 * @param {() => void} fn
 */
export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initI18n() {
  currentLang = resolveInitialLang();
  applyPageTranslations();

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (lang === "ro" || lang === "en") setLanguage(lang);
    });
  });
}
