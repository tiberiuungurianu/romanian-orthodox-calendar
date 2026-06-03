import { parseIcs, indexByDate } from "./ical-parse.js";
import {
  KIND_PRIORITY,
  badgeLabel,
  dayTone,
  eventKind,
} from "./event-kind.js";

const ICS_URL = "/calendar.ics";

const MONTH_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

/** @type {Map<string, import("./ical-parse.js").CalendarEvent[]>} */
let eventsByDate = new Map();

let viewYear;
let viewMonth;
let selectedIso = null;

const $ = (sel) => document.querySelector(sel);

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function feedUrl() {
  return new URL(ICS_URL, window.location.origin).href;
}

function webcalUrl() {
  return feedUrl().replace(/^https?:/, "webcal:");
}

function renderEventItem(ev) {
  const kind = eventKind(ev.summary);
  return `<li class="event-item event-item--${kind}">
    <span class="event-badge">${badgeLabel(kind)}</span>
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
  title.textContent = `Astăzi — ${d} ${MONTH_NAMES[m - 1]} ${y}`;

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

  if (!selectedIso) {
    panel.hidden = true;
    return;
  }

  const events = eventsByDate.get(selectedIso) || [];
  const [y, m, d] = selectedIso.split("-").map(Number);
  title.textContent = `${d} ${MONTH_NAMES[m - 1]} ${y}`;
  title.className = "day-title";
  const tone = dayTone(events);
  if (tone) title.classList.add(`day-title--${tone}`);
  list.innerHTML =
    events.length > 0
      ? events.map(renderEventItem).join("")
      : '<li class="event-item event-item--empty">Nicio înregistrare pentru această zi.</li>';
  panel.hidden = false;
}

function renderMonthLabel() {
  $("#month-label").textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function renderGrid() {
  const grid = $("#calendar-grid");
  grid.innerHTML = "";

  WEEKDAYS.forEach((wd) => {
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
      .map((k) => `<span class="dot dot--${k}" title="${badgeLabel(k)}"></span>`)
      .join("");

    cell.innerHTML = `<span class="day-num">${day}</span><span class="dots">${dots}</span>`;
    cell.setAttribute("aria-label", `${day} ${MONTH_NAMES[viewMonth]} ${viewYear}, ${events.length} evenimente`);
    cell.addEventListener("click", () => {
      selectedIso = iso;
      renderGrid();
      renderSelectedDay();
    });
    grid.appendChild(cell);
  }

  renderMonthLabel();
}

function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  } else if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderGrid();
}

function clampViewToData() {
  const dates = [...eventsByDate.keys()].sort();
  if (!dates.length) return;
  const min = dates[0];
  const max = dates[dates.length - 1];
  const cur = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  if (cur < min.slice(0, 7)) {
    const [y, m] = min.split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
  }
  if (cur > max.slice(0, 7)) {
    const [y, m] = max.split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
  }
}

async function loadCalendar() {
  setLoading(true);
  try {
    const res = await fetch(ICS_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Nu s-a putut încărca calendarul (${res.status})`);
    const text = await res.text();
    const events = parseIcs(text);
    eventsByDate = indexByDate(events);

    const [y, m] = todayIso().split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
    selectedIso = todayIso();

    clampViewToData();
    setLoading(false);
    renderToday();
    renderGrid();
    renderSelectedDay();

    const count = events.length;
    $("#meta-count").textContent = `${count} evenimente în următoarele 12 luni`;
  } catch (err) {
    showError(err instanceof Error ? err.message : "Eroare necunoscută");
  }
}

function setupSubscribe() {
  const url = feedUrl();
  $("#feed-url").textContent = url;
  $("#feed-url").href = url;

  $("#copy-feed").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiat în clipboard");
    } catch {
      toast("Nu s-a putut copia — selectează linkul manual");
    }
  });

  $("#copy-webcal").addEventListener("click", async () => {
    const w = webcalUrl();
    try {
      await navigator.clipboard.writeText(w);
      toast("Link webcal copiat (ideal pentru Apple Calendar)");
    } catch {
      toast(w);
    }
  });

  $("#open-apple").href = webcalUrl();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 2800);
}

function setupNav() {
  $("#prev-month").addEventListener("click", () => shiftMonth(-1));
  $("#next-month").addEventListener("click", () => shiftMonth(1));
  $("#go-today").addEventListener("click", () => {
    const [y, m] = todayIso().split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
    selectedIso = todayIso();
    renderGrid();
    renderToday();
    renderSelectedDay();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSubscribe();
  setupNav();
  loadCalendar();
});
