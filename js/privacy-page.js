import { initConsent } from "./consent.js";
import { initI18n, onLanguageChange, t } from "./i18n.js";
import { initTheme } from "./theme.js";

function syncPageMeta() {
  document.title = t("privacy.meta.title");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("privacy.meta.description"));
}

initI18n();
initTheme();
initConsent();
syncPageMeta();
onLanguageChange(syncPageMeta);
