/**
 * Minimal RFC 5545 parser for all-day VEVENT blocks from calendar.ics.
 */

/**
 * @typedef {{ date: string, summary: string, uid: string }} CalendarEvent
 */

/**
 * Unfold continuation lines (space-prefixed).
 * @param {string} raw
 * @returns {string[]}
 */
function unfoldLines(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const unfolded = [];
  for (const line of lines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (unfolded.length) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else if (line.trim()) {
      unfolded.push(line);
    }
  }
  return unfolded;
}

/**
 * Decode SUMMARY escape sequences.
 * @param {string} value
 * @returns {string}
 */
function unescapeText(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * @param {string} icsText
 * @returns {CalendarEvent[]}
 */
export function parseIcs(icsText) {
  const lines = unfoldLines(icsText);
  /** @type {CalendarEvent[]} */
  const events = [];
  /** @type {Record<string, string>} */
  let current = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      const start = current.DTSTART;
      const summary = current.SUMMARY;
      if (start && summary) {
        const date = start.length >= 8 ? start.slice(0, 8) : start;
        events.push({
          date,
          summary: unescapeText(summary),
          uid: current.UID || `${date}-${summary}`,
        });
      }
      current = {};
      continue;
    }

    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const keyPart = line.slice(0, sep);
    const value = line.slice(sep + 1);
    const key = keyPart.split(";")[0];
    if (key === "DTSTART" || key === "SUMMARY" || key === "UID") {
      current[key] = value;
    }
  }

  return events;
}

/**
 * Group events by YYYY-MM-DD.
 * @param {CalendarEvent[]} events
 * @returns {Map<string, CalendarEvent[]>}
 */
export function indexByDate(events) {
  /** @type {Map<string, CalendarEvent[]>} */
  const map = new Map();
  for (const ev of events) {
    const iso =
      ev.date.length === 8
        ? `${ev.date.slice(0, 4)}-${ev.date.slice(4, 6)}-${ev.date.slice(6, 8)}`
        : ev.date;
    if (!map.has(iso)) map.set(iso, []);
    map.get(iso).push(ev);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.summary.localeCompare(b.summary, "ro"));
  }
  return map;
}
