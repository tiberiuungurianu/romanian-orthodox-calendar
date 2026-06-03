/**
 * Multi-provider analytics — enable on <html> when deployed (see README → Traffic).
 *
 * Providers (use as many as you want):
 *   data-ga-measurement-id="G-XXXX"     → Google Analytics 4 (broadest reports)
 *   data-clarity-id="xxxxxxxx"          → Microsoft Clarity (heatmaps + recordings)
 *   data-plausible-domain="yoursite.app" → Plausible (simple, privacy-oriented)
 *
 * Skipped on localhost. Tracks page context, UTM tags, session time, and UI events.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const CONSENT_KEY = "roc-cookie-consent";

/**
 * @returns {boolean}
 */
function hasAnalyticsConsent() {
  const root = document.documentElement;
  const hasProvider = Boolean(
    root.dataset.gaMeasurementId?.trim() ||
      root.dataset.clarityId?.trim() ||
      root.dataset.plausibleDomain?.trim()
  );
  if (!hasProvider) return false;
  return localStorage.getItem(CONSENT_KEY) === "all";
}

/** @type {number} */
let sessionStart = Date.now();

/** @type {string | null} */
let lastMonthKey = null;

/**
 * @returns {boolean}
 */
export function isAnalyticsEnabled() {
  return !LOCAL_HOSTS.has(window.location.hostname);
}

/**
 * @param {string} src
 * @param {() => void} [onload]
 */
function loadScript(src, onload) {
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = src;
  if (onload) script.onload = onload;
  document.head.appendChild(script);
}

/**
 * @returns {Record<string, string>}
 */
function utmParams() {
  const params = new URLSearchParams(window.location.search);
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

/**
 * @returns {Record<string, string>}
 */
function pageContext() {
  return {
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title,
    language: document.documentElement.lang || "ro",
    screen_width: String(window.screen.width),
    screen_height: String(window.screen.height),
    viewport_width: String(window.innerWidth),
    viewport_height: String(window.innerHeight),
    referrer: document.referrer || "(direct)",
    ...utmParams(),
  };
}

/**
 * @param {string} measurementId
 */
function initGoogleAnalytics(measurementId) {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  function gtag(...args) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: true,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    anonymize_ip: false,
    ...utmParams(),
  });
  gtag("set", "user_properties", {
    interface_language: document.documentElement.lang || "ro",
  });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
}

/**
 * @param {string} projectId
 */
function initClarity(projectId) {
  if (window.clarity || document.querySelector('script[data-clarity="true"]')) return;
  window.clarity =
    window.clarity ||
    function (...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
  const script = document.createElement("script");
  script.async = true;
  script.dataset.clarity = "true";
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
}

/**
 * @param {string} domain
 */
function initPlausible(domain) {
  if (document.querySelector('script[data-plausible="true"]')) return;
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.plausible = "true";
  script.dataset.domain = domain;
  script.src = "https://plausible.io/js/script.manual.js";
  script.onload = () => {
    if (typeof window.plausible === "function") {
      window.plausible("pageview", { props: pageContext() });
    }
  };
  document.head.appendChild(script);
  window.plausible =
    window.plausible ||
    function (...args) {
      (window.plausible.q = window.plausible.q || []).push(args);
    };
}

/**
 * @param {string} name
 * @param {Record<string, string | number | boolean>} [props]
 */
export function trackEvent(name, props = {}) {
  if (!isAnalyticsEnabled() || !hasAnalyticsConsent()) return;

  const payload = {
    ...pageContext(),
    ...Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, String(v)])
    ),
  };

  const plausibleDomain = document.documentElement.dataset.plausibleDomain?.trim();
  if (plausibleDomain && typeof window.plausible === "function") {
    window.plausible(name, { props: payload });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }

  if (typeof window.clarity === "function") {
    window.clarity("event", name);
    for (const [key, value] of Object.entries(payload)) {
      window.clarity("set", key, value);
    }
  }
}

/**
 * @param {number} year
 * @param {number} monthIndex 0–11
 * @param {string} source
 */
export function trackViewMonth(year, monthIndex, source) {
  const key = `${year}-${monthIndex}`;
  if (key === lastMonthKey && source !== "initial") return;
  lastMonthKey = key;
  trackEvent("view_month", {
    year,
    month: monthIndex + 1,
    month_name: monthIndex,
    source,
  });
}

/**
 * @param {string} iso YYYY-MM-DD
 * @param {number} eventCount
 */
export function trackSelectDay(iso, eventCount) {
  trackEvent("select_day", { date: iso, event_count: eventCount });
}

function initOutboundTracking() {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.href;
      if (!href || href.startsWith(window.location.origin)) return;
      trackEvent("outbound_click", {
        link_url: href,
        link_text: (anchor.textContent || "").trim().slice(0, 80),
      });
    },
    true
  );
}

function initDownloadTracking() {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!anchor.href.endsWith(".ics") && !anchor.download) return;
      trackEvent("download_ics", { link_url: anchor.href });
    },
    true
  );
}

function initEngagementTracking() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const seconds = Math.round((Date.now() - sessionStart) / 1000);
      trackEvent("session_end", { engagement_seconds: seconds });
    }
  });
}

function initHelpPanelTracking() {
  const help = document.querySelector(".subscribe-help");
  help?.addEventListener("toggle", () => {
    if (help.open) trackEvent("subscribe_help_open");
  });
}

function initHeaderSubscribeTracking() {
  document.querySelector('a[href="#abonare"]')?.addEventListener("click", () => {
    trackEvent("header_subscribe_click");
  });
}

function initFeedInputTracking() {
  document.querySelector("#feed-input")?.addEventListener("focus", () => {
    trackEvent("feed_link_focus");
  });
}

export function initAnalytics() {
  if (!isAnalyticsEnabled() || !hasAnalyticsConsent()) return;

  sessionStart = Date.now();
  const root = document.documentElement;
  const gaId = root.dataset.gaMeasurementId?.trim();
  const clarityId = root.dataset.clarityId?.trim();
  const plausibleDomain = root.dataset.plausibleDomain?.trim();

  if (gaId) initGoogleAnalytics(gaId);
  if (clarityId) initClarity(clarityId);
  if (plausibleDomain) initPlausible(plausibleDomain);

  trackEvent("site_context", pageContext());

  initOutboundTracking();
  initDownloadTracking();
  initEngagementTracking();
  initHelpPanelTracking();
  initHeaderSubscribeTracking();
  initFeedInputTracking();
}
