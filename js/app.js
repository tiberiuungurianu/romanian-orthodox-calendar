import { parseIcs, indexByDate } from "./ical-parse.js";
import { KIND_PRIORITY, dayTone, eventKind } from "./event-kind.js";
import {
  getBadgeLabel,
  getLang,
  getMonthName,
  getWeekdays,
  initI18n,
  onLanguageChange,
  t,
} from "./i18n.js";
import { refreshSubscribeLinks, setupSubscribe } from "./subscribe.js";
import {
  trackEvent,
  trackSelectDay,
  trackViewMonth,
} from "./analytics.js";
import { initConsent } from "./consent.js";
import { initTheme } from "./theme.js";
import { updateSeo } from "./seo.js";

const ICS_URL = "/calendar.ics";

/** Always render 6 week rows so the calendar box never changes height. */
const CALENDAR_WEEK_ROWS = 6;
const CALENDAR_DAY_SLOTS = CALENDAR_WEEK_ROWS * 7;

/** @type {Map<string, import("./ical-parse.js").CalendarEvent[]>} */
let eventsByDate = new Map();

let viewYear;
let viewMonth;
let selectedIso = null;

/** @type {{ year: number, month: number }[]} */
let availableMonths = [];

/** @type {number | null} */
let loadedEventCount = null;

const $ = (sel) => document.querySelector(sel);

function updateMetaCount() {
  const el = $("#meta-count");
  if (!el || loadedEventCount === null) return;
  el.textContent = t("meta.events", { count: loadedEventCount });
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function renderEventItem(ev) {
  const kind = eventKind(ev.summary);
  return `<li class="event-item event-item--${kind}">
    <span class="event-badge">${getBadgeLabel(kind)}</span>
    <span class="event-title">${escapeHtml(ev.summary)}</span>
  </li>`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setLoading(on) {
  $("#loader").hidden = !on;
  $("#app").hidden = on;
  $("#error-panel").hidden = true;
}

function showError(message) {
  setLoading(false);
  $("#app").hidden = true;
  $("#error-panel").hidden = false;
  $("#error-message").textContent = message;
}

function renderToday() {
  const iso = todayIso();
  const events = eventsByDate.get(iso) || [];
  const title = $("#today-title");
  const list = $("#today-events");
  const empty = $("#today-empty");

  const [y, m, d] = iso.split("-").map(Number);
  title.textContent = `${d} ${getMonthName(m - 1)} ${y}`;
  title.className = "section-title";
  const todayTone = dayTone(events);
  if (todayTone) title.classList.add(`day-title--${todayTone}`);

  if (events.length === 0) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  list.innerHTML = events.map(renderEventItem).join("");
}

function renderSelectedDay() {
  const panel = $("#day-panel");
  const title = $("#day-title");
  const list = $("#day-events");
  const empty = $("#day-panel-empty");
  if (!panel || !title || !list || !empty) return;

  if (!selectedIso) {
    panel.classList.add("day-detail-slot--idle");
    title.textContent = "—";
    title.className = "section-title";
    empty.hidden = false;
    list.hidden = true;
    list.innerHTML = "";
    return;
  }

  const events = eventsByDate.get(selectedIso) || [];
  const [y, m, d] = selectedIso.split("-").map(Number);
  title.textContent = `${d} ${getMonthName(m - 1)} ${y}`;
  title.className = "section-title";
  const tone = dayTone(events);
  if (tone) title.classList.add(`day-title--${tone}`);

  panel.classList.remove("day-detail-slot--idle");
  empty.hidden = true;
  list.hidden = false;
  list.innerHTML =
    events.length > 0
      ? events.map(renderEventItem).join("")
      : `<li class="event-item event-item--empty">${t("day.empty")}</li>`;
}

function renderMonthLabel() {
  $("#month-label").textContent = `${getMonthName(viewMonth)} ${viewYear}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function renderGrid() {
  const grid = $("#calendar-grid");
  grid.innerHTML = "";

  getWeekdays().forEach((wd) => {
    const el = document.createElement("div");
    el.className = "grid-weekday";
    el.textContent = wd;
    grid.appendChild(el);
  });

  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const totalDays = daysInMonth(viewYear, viewMonth);
  const today = todayIso();

  for (let i = 0; i < firstDow; i++) {
    const pad = document.createElement("div");
    pad.className = "grid-cell grid-cell--pad";
    grid.appendChild(pad);
  }

  for (let day = 1; day <= totalDays; day++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const events = eventsByDate.get(iso) || [];
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "grid-cell";
    if (iso === today) cell.classList.add("grid-cell--today");
    if (iso === selectedIso) cell.classList.add("grid-cell--selected");
    if (events.length) cell.classList.add("grid-cell--has-events");

    const tone = dayTone(events);
    if (tone) cell.classList.add(`grid-cell--tone-${tone}`);

    const kindsOnDay = KIND_PRIORITY.filter((k) =>
      events.some((e) => eventKind(e.summary) === k)
    );
    const dots = kindsOnDay
      .map((k) => `<span class="dot dot--${k}" title="${getBadgeLabel(k)}"></span>`)
      .join("");

    cell.innerHTML = `<span class="day-num">${day}</span><span class="dots">${dots}</span>`;
    cell.setAttribute(
      "aria-label",
      t("cal.dayAria", {
        day,
        month: getMonthName(viewMonth),
        year: viewYear,
        count: events.length,
      })
    );
    cell.addEventListener("click", (e) => {
      e.preventDefault();
      selectedIso = iso;
      trackSelectDay(iso, events.length);
      renderGrid();
      renderSelectedDay();
      cell.blur();
    });
    grid.appendChild(cell);
  }

  const trailingPads = CALENDAR_DAY_SLOTS - firstDow - totalDays;
  for (let i = 0; i < trailingPads; i++) {
    const pad = document.createElement("div");
    pad.className = "grid-cell grid-cell--pad";
    pad.setAttribute("aria-hidden", "true");
    grid.appendChild(pad);
  }

  renderMonthLabel();
  renderMonthPicker();
}

function buildAvailableMonths() {
  const keys = new Set();
  for (const iso of eventsByDate.keys()) {
    keys.add(iso.slice(0, 7));
  }
  availableMonths = [...keys]
    .sort()
    .map((ym) => {
      const [year, month] = ym.split("-").map(Number);
      return { year, month: month - 1 };
    });
}

function currentViewIndex() {
  return availableMonths.findIndex(
    (m) => m.year === viewYear && m.month === viewMonth
  );
}

/**
 * @param {number} year
 * @param {number} month
 * @param {string} [source]
 */
function setViewMonth(year, month, source = "unknown") {
  viewYear = year;
  viewMonth = month;
  if (selectedIso) {
    const [sy, sm] = selectedIso.split("-").map(Number);
    if (sy !== year || sm !== month + 1) {
      selectedIso = null;
      renderSelectedDay();
    }
  }
  renderGrid();
  trackViewMonth(year, month, source);
}

function renderMonthPicker() {
  const matrix = $("#month-matrix");
  if (!matrix) return;
  matrix.innerHTML = "";

  const today = todayIso();
  const todayYm = today.slice(0, 7);

  for (const { year, month } of availableMonths) {
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "month-cell glass-inset";
    if (year === viewYear && month === viewMonth) {
      btn.classList.add("month-cell--active");
      btn.setAttribute("aria-current", "true");
    }
    if (ym === todayYm) {
      btn.classList.add("month-cell--current-month");
    }

    btn.innerHTML = `<span class="month-cell__name">${getMonthName(month)}</span><span class="month-cell__year">${year}</span>`;
    btn.setAttribute("aria-label", `${getMonthName(month)} ${year}`);
    btn.addEventListener("click", () => setViewMonth(year, month, "month_matrix"));
    matrix.appendChild(btn);
  }
}

function shiftMonth(delta) {
  const idx = currentViewIndex();
  if (idx === -1 || !availableMonths.length) return;
  const next = availableMonths[idx + delta];
  if (!next) return;
  setViewMonth(next.year, next.month, delta < 0 ? "prev_month" : "next_month");
}

function clampViewToData() {
  buildAvailableMonths();
  if (!availableMonths.length) return;
  const idx = currentViewIndex();
  if (idx === -1) {
    const [y, m] = todayIso().split("-").map(Number);
    const todayIdx = availableMonths.findIndex(
      (item) => item.year === y && item.month === m - 1
    );
    const pick = todayIdx >= 0 ? availableMonths[todayIdx] : availableMonths[0];
    viewYear = pick.year;
    viewMonth = pick.month;
  }
}

async function loadCalendar() {
  setLoading(true);
  try {
    const res = await fetch(ICS_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(t("error.load", { status: res.status }));
    const text = await res.text();
    const events = parseIcs(text);
    eventsByDate = indexByDate(events);

    const [y, m] = todayIso().split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
    selectedIso = null;

    clampViewToData();
    setLoading(false);
    renderToday();
    renderGrid();
    renderSelectedDay();
    renderMonthPicker();

    loadedEventCount = events.length;
    updateMetaCount();
    trackEvent("calendar_loaded", {
      event_count: loadedEventCount,
      months_available: availableMonths.length,
    });
    trackViewMonth(viewYear, viewMonth, "initial");
  } catch (err) {
    const message = err instanceof Error ? err.message : t("error.unknown");
    trackEvent("calendar_load_error", { message });
    showError(message);
  }
}

function syncSeo() {
  updateSeo({
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: t("meta.keywords"),
    feedTitle: t("meta.feedTitle"),
    lang: getLang(),
  });
}

function refreshUi() {
  syncSeo();
  applyStaticI18nAria();
  refreshSubscribeLinks();
  updateMetaCount();
  renderToday();
  renderGrid();
  renderSelectedDay();
  renderMonthPicker();
}

function applyStaticI18nAria() {
  const prev = $("#prev-month");
  const next = $("#next-month");
  const grid = $("#calendar-grid");
  if (prev) prev.setAttribute("aria-label", t("cal.prev"));
  if (next) next.setAttribute("aria-label", t("cal.next"));
  if (grid) grid.setAttribute("aria-label", t("cal.gridLabel"));
}

function setupNav() {
  $("#prev-month").addEventListener("click", () => shiftMonth(-1));
  $("#next-month").addEventListener("click", () => shiftMonth(1));
  $("#go-today").addEventListener("click", () => {
    const [y, m] = todayIso().split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
    selectedIso = null;
    trackEvent("go_today_click");
    setViewMonth(y, m - 1, "today_button");
    renderToday();
    renderSelectedDay();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initI18n();
  initTheme();
  initConsent();
  syncSeo();
  setupSubscribe();
  setupNav();
  onLanguageChange(refreshUi);
  loadCalendar();
});
