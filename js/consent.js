/**
 * Cookie consent — analytics scripts load only after explicit opt-in (EU-friendly).
 */

import { initAnalytics } from "./analytics.js";
import { getLang, onLanguageChange, t } from "./i18n.js";

const CONSENT_KEY = "roc-cookie-consent";

/** @typedef {'all' | 'essential'} ConsentChoice */

/**
 * @returns {boolean}
 */
export function hasAnalyticsProviders() {
  const root = document.documentElement;
  return Boolean(
    root.dataset.gaMeasurementId?.trim() ||
      root.dataset.clarityId?.trim() ||
      root.dataset.plausibleDomain?.trim()
  );
}

/**
 * @returns {boolean}
 */
export function hasAnalyticsConsent() {
  if (!hasAnalyticsProviders()) return false;
  return getStoredConsent() === "all";
}

/**
 * @returns {ConsentChoice | null}
 */
function getStoredConsent() {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "all" || value === "essential") return value;
  return null;
}

/**
 * @param {ConsentChoice} choice
 */
function saveConsent(choice) {
  localStorage.setItem(CONSENT_KEY, choice);
}

/**
 * @returns {boolean}
 */
function shouldShowBanner() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return false;
  }
  if (!hasAnalyticsProviders()) return false;
  return getStoredConsent() === null;
}

function hideBanner() {
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    banner.hidden = true;
    banner.setAttribute("aria-hidden", "true");
  }
}

function applyBannerText() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;
  banner.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
}

function showBanner() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;
  applyBannerText();
  banner.hidden = false;
  banner.setAttribute("aria-hidden", "false");
}

/**
 * @param {ConsentChoice} choice
 */
function applyConsent(choice) {
  saveConsent(choice);
  hideBanner();
  if (choice === "all") {
    initAnalytics();
  }
}

function wireBanner() {
  document.getElementById("cookie-accept")?.addEventListener("click", () => {
    applyConsent("all");
  });
  document.getElementById("cookie-reject")?.addEventListener("click", () => {
    applyConsent("essential");
  });
}

/**
 * Re-open banner (e.g. from footer link).
 */
export function openCookieSettings() {
  if (!hasAnalyticsProviders()) return;
  showBanner();
}

export function initConsent() {
  wireBanner();

  const settingsLink = document.getElementById("cookie-settings-link");
  const settingsRow = settingsLink?.closest("p");
  if (!hasAnalyticsProviders()) {
    if (settingsRow) settingsRow.hidden = true;
  }

  settingsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openCookieSettings();
  });

  onLanguageChange(applyBannerText);

  const stored = getStoredConsent();
  if (stored === "all") {
    initAnalytics();
    return;
  }

  if (shouldShowBanner()) {
    showBanner();
  }
}
