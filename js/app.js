import { parseIcs, indexByDate } from "./ical-parse.js";
import { KIND_PRIORITY, dayTone, eventKind } from "./event-kind.js";
import { formatEventSummary } from "./event-summary-en.js";
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
import { initScrollTop } from "./scroll-top.js";
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

/** Touch / narrow UI — sheet on phones (incl. Pro Max landscape via coarse pointer). */
function isMobileSheetUi() {
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

/** Scroll position before sheet locks the page (iOS reports scrollY as 0). */
let scrollYBeforeDaySheet = 0;

/**
 * Keep #day-panel on document.body for iOS (fixed inside .glass breaks).
 * Dock back into the calendar card on desktop layout.
 */
function ensureDayPanelHost() {
  const panel = $("#day-panel");
  const anchor = $("#day-panel-anchor");
  const backdrop = $("#day-sheet-backdrop");
  if (!panel || !anchor) return;

  const mobile = isMobileSheetUi();
  if (mobile) {
    anchor.hidden = true;
    if (panel.parentElement !== document.body) {
      document.body.insertBefore(panel, backdrop ?? null);
    }
    return;
  }

  anchor.hidden = true;
  if (panel.parentElement !== anchor.parentElement) {
    anchor.insertAdjacentElement("afterend", panel);
  }
}

/** Mobile: fixed bottom sheet so day details never reflow the page. */
function syncDaySheetUi() {
  ensureDayPanelHost();
  const open = isMobileSheetUi() && Boolean(selectedIso);
  const panel = $("#day-panel");
  const wasOpen = document.documentElement.classList.contains("day-sheet-open");
  if (open && !wasOpen) {
    scrollYBeforeDaySheet = window.scrollY;
  }
  document.documentElement.classList.toggle("day-sheet-open", open);
  if (!open && scrollYBeforeDaySheet > 0) {
    const y = scrollYBeforeDaySheet;
    scrollYBeforeDaySheet = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      document.getElementById("scroll-top")?.dispatchEvent(new Event("layout-chrome-change"));
    });
  }
  const backdrop = $("#day-sheet-backdrop");
  if (backdrop) {
    backdrop.hidden = !open;
    backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }
  const closeBtn = $("#day-sheet-close");
  if (closeBtn) {
    closeBtn.hidden = !open;
  }
  if (panel) {
    if (isMobileSheetUi()) {
      panel.setAttribute("aria-modal", open ? "true" : "false");
      panel.setAttribute("role", open ? "dialog" : "region");
    } else {
      panel.removeAttribute("aria-modal");
      panel.setAttribute("role", "region");
    }
  }
  document.getElementById("scroll-top")?.dispatchEvent(new Event("layout-chrome-change"));
}

function clearSelectedDay() {
  const prevIso = selectedIso;
  if (!prevIso) return;
  selectedIso = null;
  updateGridSelection(prevIso, null);
  renderSelectedDay();
}

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
    <span class="event-title">${escapeHtml(formatEventSummary(ev.summary))}</span>
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

/**
 * @param {{ animate?: boolean }} [opts]
 */
function renderSelectedDay(opts = {}) {
  const panel = $("#day-panel");
  const title = $("#day-title");
  const list = $("#day-events");
  const empty = $("#day-panel-empty");
  if (!panel || !title || !list || !empty) return;

  if (!selectedIso) {
    panel.classList.remove("day-detail-slot--enter");
    panel.classList.add("day-detail-slot--idle");
    title.textContent = "—";
    title.className = "section-title";
    empty.hidden = false;
    list.hidden = true;
    list.innerHTML = "";
    syncDaySheetUi();
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

  if (opts.animate) {
    panel.classList.remove("day-detail-slot--enter");
    void panel.offsetWidth;
    panel.classList.add("day-detail-slot--enter");
  }

  syncDaySheetUi();
}

function updateGridSelection(prevIso, nextIso) {
  const grid = $("#calendar-grid");
  if (!grid) return;
  if (prevIso) {
    const prev = grid.querySelector(`[data-iso="${prevIso}"]`);
    prev?.classList.remove("grid-cell--selected");
    prev?.removeAttribute("aria-selected");
  }
  if (nextIso) {
    const next = grid.querySelector(`[data-iso="${nextIso}"]`);
    next?.classList.add("grid-cell--selected");
    next?.setAttribute("aria-selected", "true");
  }
}

function renderMonthLabel() {
  const nameEl = $("#month-label-name");
  const yearEl = $("#month-label-year");
  if (nameEl) nameEl.textContent = getMonthName(viewMonth);
  if (yearEl) yearEl.textContent = String(viewYear);
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
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.setAttribute("role", "gridcell");
    cell.tabIndex = -1;
    cell.dataset.iso = iso;
    if (iso === today) cell.classList.add("grid-cell--today");
    if (iso === selectedIso) {
      cell.classList.add("grid-cell--selected");
      cell.setAttribute("aria-selected", "true");
    }
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
      const prevIso = selectedIso;
      if (prevIso === iso) return;
      selectedIso = iso;
      lastMonthChangeSource = "day_select";
      trackSelectDay(iso, events.length);
      updateGridSelection(prevIso, iso);
      renderSelectedDay({ animate: isMobileSheetUi() });
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
/** @type {string} */
let lastMonthChangeSource = "unknown";

function syncMonthPickerState(matrix) {
  const todayYm = todayIso().slice(0, 7);
  [...matrix.children].forEach((btn, i) => {
    const { year, month } = availableMonths[i];
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    const isActive = year === viewYear && month === viewMonth;
    btn.classList.toggle("month-cell--active", isActive);
    btn.classList.toggle("month-cell--current-month", ym === todayYm);
    if (isActive) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
}

function setViewMonth(year, month, source = "unknown") {
  lastMonthChangeSource = source;
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

  const today = todayIso();
  const todayYm = today.slice(0, 7);

  if (matrix.children.length === availableMonths.length) {
    syncMonthPickerState(matrix);
    return;
  }

  matrix.innerHTML = "";

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
    lastMonthChangeSource = "initial";
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
  lastMonthChangeSource = "ui_refresh";
  syncSeo();
  applyStaticI18nAria();
  refreshSubscribeLinks();
  updateMetaCount();
  ensureDayPanelHost();
  renderToday();
  renderGrid();
  renderSelectedDay();
}

function applyStaticI18nAria() {
  const prev = $("#prev-month");
  const next = $("#next-month");
  const grid = $("#calendar-grid");
  if (prev) prev.setAttribute("aria-label", t("cal.prev"));
  if (next) next.setAttribute("aria-label", t("cal.next"));
  if (grid) grid.setAttribute("aria-label", t("cal.gridLabel"));
}

function blurOnTap(el) {
  el?.addEventListener("click", () => {
    requestAnimationFrame(() => el.blur());
  });
}

function setupNav() {
  const prev = $("#prev-month");
  const next = $("#next-month");
  const todayBtn = $("#go-today");
  prev?.addEventListener("click", () => shiftMonth(-1));
  next?.addEventListener("click", () => shiftMonth(1));
  blurOnTap(prev);
  blurOnTap(next);
  blurOnTap(todayBtn);
  todayBtn?.addEventListener("click", () => {
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
  initScrollTop();
  syncSeo();
  setupSubscribe();
  setupNav();
  setupDaySheet();
  ensureDayPanelHost();
  onLanguageChange(refreshUi);
  loadCalendar();
});

function setupDaySheet() {
  const onLayoutChange = () => ensureDayPanelHost();
  window.addEventListener("resize", onLayoutChange, { passive: true });
  window.addEventListener("orientationchange", onLayoutChange, { passive: true });

  $("#day-sheet-close")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isMobileSheetUi()) clearSelectedDay();
  });
  $("#day-sheet-backdrop")?.addEventListener("click", () => {
    if (isMobileSheetUi()) clearSelectedDay();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobileSheetUi() && selectedIso) clearSelectedDay();
  });
}
