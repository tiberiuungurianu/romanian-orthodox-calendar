/**
 * Light / dark theme — persisted in localStorage.
 */

import { onLanguageChange, t } from "./i18n.js";

const STORAGE_KEY = "roc-theme";

/** @typedef {'light' | 'dark'} Theme */

const THEME_COLORS = {
  light: "#e8f4f8",
  dark: "#0f1820",
};

/**
 * @returns {Theme}
 */
export function getTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

/**
 * @param {Theme} theme
 */
export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
  syncThemeColor(theme);
  updateThemeToggle();
}

function syncThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

function updateThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const theme = getTheme();
  const toDark = theme === "light";
  btn.setAttribute("aria-pressed", toDark ? "false" : "true");
  btn.setAttribute("aria-label", t(toDark ? "theme.toDark" : "theme.toLight"));
  btn.title = t(toDark ? "theme.toDark" : "theme.toLight");
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute("data-theme", theme);
  syncThemeColor(theme);

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  });

  updateThemeToggle();
  onLanguageChange(updateThemeToggle);
}
