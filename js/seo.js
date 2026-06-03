/**
 * SEO: meta tags, Open Graph, canonical URL, JSON-LD.
 */

/**
 * @typedef {object} SeoPayload
 * @property {string} title
 * @property {string} description
 * @property {string} keywords
 * @property {string} feedTitle
 * @property {'ro' | 'en'} lang
 */

/**
 * @returns {string}
 */
export function siteOrigin() {
  return window.location.origin;
}

/**
 * @returns {string}
 */
export function pageUrl() {
  return new URL("/", siteOrigin()).href;
}

/**
 * @returns {string}
 */
export function feedAbsoluteUrl() {
  return new URL("/calendar.ics", siteOrigin()).href;
}

/**
 * @param {"name" | "property"} kind
 * @param {string} key
 * @param {string} content
 */
function ensureMeta(kind, key, content) {
  const selector =
    kind === "property" ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (kind === "property") {
      el.setAttribute("property", key);
    } else {
      el.setAttribute("name", key);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * @param {SeoPayload} payload
 * @returns {string}
 */
function jsonLdScript(payload) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${pageUrl()}#website`,
        url: pageUrl(),
        name: payload.title,
        description: payload.description,
        inLanguage: payload.lang === "ro" ? "ro-RO" : "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl()}#app`,
        name: payload.title,
        description: payload.description,
        url: pageUrl(),
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "RON",
        },
        isAccessibleForFree: true,
      },
      {
        "@type": "DataDownload",
        name: payload.feedTitle,
        contentUrl: feedAbsoluteUrl(),
        encodingFormat: "text/calendar",
      },
    ],
  };
  return JSON.stringify(data);
}

/**
 * @param {SeoPayload} payload
 */
export function updateSeo(payload) {
  const url = pageUrl();
  const locale = payload.lang === "ro" ? "ro_RO" : "en_US";

  document.title = payload.title;

  ensureMeta("name", "description", payload.description);
  ensureMeta("name", "keywords", payload.keywords);
  ensureMeta("name", "robots", "index, follow, max-image-preview:large");

  ensureMeta("property", "og:type", "website");
  ensureMeta("property", "og:site_name", payload.title);
  ensureMeta("property", "og:title", payload.title);
  ensureMeta("property", "og:description", payload.description);
  ensureMeta("property", "og:url", url);
  ensureMeta("property", "og:locale", locale);
  ensureMeta(
    "property",
    "og:locale:alternate",
    payload.lang === "ro" ? "en_US" : "ro_RO"
  );

  ensureMeta("name", "twitter:card", "summary");
  ensureMeta("name", "twitter:title", payload.title);
  ensureMeta("name", "twitter:description", payload.description);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);

  const feedAlt = document.querySelector('link[rel="alternate"][type="text/calendar"]');
  if (feedAlt) feedAlt.setAttribute("title", payload.feedTitle);

  let ld = document.getElementById("json-ld");
  if (!ld) {
    ld = document.createElement("script");
    ld.id = "json-ld";
    ld.type = "application/ld+json";
    document.head.appendChild(ld);
  }
  ld.textContent = jsonLdScript(payload);
}
