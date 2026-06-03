import { onLanguageChange, t } from "./i18n.js";
import { trackEvent } from "./analytics.js";

const SCROLL_THRESHOLD = 360;

/**
 * @param {HTMLElement} btn
 */
function syncScrollTopAria(btn) {
  btn.setAttribute("aria-label", t("scrollTop.aria"));
}

/**
 * @param {HTMLElement} btn
 */
function updateScrollTopState(btn) {
  const sheetOpen = document.documentElement.classList.contains("day-sheet-open");
  const show = window.scrollY > SCROLL_THRESHOLD || sheetOpen;
  btn.hidden = !show;
  btn.classList.toggle("is-visible", show);

  const banner = document.getElementById("cookie-banner");
  btn.classList.toggle("scroll-top--raised", Boolean(banner && !banner.hidden));
  btn.classList.toggle("scroll-top--over-sheet", sheetOpen);
}

export function initScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;

  syncScrollTopAria(btn);
  onLanguageChange(() => syncScrollTopAria(btn));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollTopState(btn);
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  const banner = document.getElementById("cookie-banner");
  if (banner) {
    new MutationObserver(onScroll).observe(banner, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
  }

  btn.addEventListener("click", () => {
    trackEvent("scroll_top_click");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    btn.blur();
  });

  document.addEventListener("layout-chrome-change", () => updateScrollTopState(btn));

  updateScrollTopState(btn);
}
