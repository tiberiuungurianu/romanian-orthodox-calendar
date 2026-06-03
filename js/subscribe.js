/**
 * Subscribe / share helpers — public iCalendar feed URL for any visitor.
 */

import { trackEvent } from "./analytics.js";
import { showToast } from "./toast.js";
import { t } from "./i18n.js";

/**
 * @param {string} path
 */
export function feedUrl(path = "/calendar.ics") {
  return new URL(path, window.location.origin).href;
}

/**
 * @param {string} httpsUrl
 */
export function webcalUrl(httpsUrl) {
  return httpsUrl.replace(/^https?:/, "webcal:");
}

/**
 * @param {string} httpsUrl
 */
export function googleCalendarSubscribeUrl(httpsUrl) {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(httpsUrl)}`;
}

/**
 * @param {string} httpsUrl
 */
export function outlookSubscribeUrl(httpsUrl) {
  const params = new URLSearchParams({
    url: httpsUrl,
    name: t("calendar.exportName"),
  });
  return `https://outlook.live.com/calendar/addfromweb?${params.toString()}`;
}

/**
 * @param {string} text
 */
async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

/**
 * Wire subscribe UI once DOM is ready.
 */
export function setupSubscribe() {
  const url = feedUrl();
  const webcal = webcalUrl(url);

  const input = document.querySelector("#feed-input");
  const copyBtn = document.querySelector("#copy-feed");
  const copyWebcalBtn = document.querySelector("#copy-webcal");
  const shareBtn = document.querySelector("#share-feed");
  const appleLink = document.querySelector("#open-apple");
  const googleLink = document.querySelector("#open-google");
  const outlookLink = document.querySelector("#open-outlook");
  const downloadLink = document.querySelector("#download-ics");

  if (input) {
    input.value = url;
  }

  if (downloadLink) {
    downloadLink.href = url;
  }

  if (appleLink) {
    appleLink.href = webcal;
  }

  if (googleLink) {
    googleLink.href = googleCalendarSubscribeUrl(url);
  }

  if (outlookLink) {
    outlookLink.href = outlookSubscribeUrl(url);
  }

  copyBtn?.addEventListener("click", async () => {
    try {
      await copyText(url);
      trackEvent("copy_feed_link");
      showToast(t("toast.copyFeed"));
    } catch {
      input?.select();
      showToast(t("toast.copyManual"));
    }
  });

  copyWebcalBtn?.addEventListener("click", async () => {
    try {
      await copyText(webcal);
      trackEvent("copy_webcal_link");
      showToast(t("toast.copyWebcal"));
    } catch {
      showToast(webcal);
    }
  });

  appleLink?.addEventListener("click", () => trackEvent("subscribe_apple_calendar"));
  googleLink?.addEventListener("click", () => trackEvent("subscribe_google_calendar"));
  outlookLink?.addEventListener("click", () => trackEvent("subscribe_outlook"));

  if (shareBtn && navigator.share) {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", async () => {
      try {
        await navigator.share({
          title: t("calendar.exportName"),
          text: t("toast.shareText"),
          url,
        });
        trackEvent("share_feed_link");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          showToast(t("toast.shareFail"));
        }
      }
    });
  }
}

/**
 * Update links that depend on translated calendar name (e.g. after language switch).
 */
export function refreshSubscribeLinks() {
  const url = feedUrl();
  const outlookLink = document.querySelector("#open-outlook");
  if (outlookLink) {
    outlookLink.href = outlookSubscribeUrl(url);
  }
}
