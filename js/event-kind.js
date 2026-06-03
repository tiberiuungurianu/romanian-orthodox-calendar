/**
 * Event categories for at-a-glance calendar colors.
 *
 * Priority (highest wins on a day cell): major > feast > saint > fasting
 */

/** @typedef {'major' | 'feast' | 'saint' | 'fasting'} EventKind */

/** @type {EventKind[]} */
export const KIND_PRIORITY = ["major", "feast", "saint", "fasting"];

/** Praznice mari — roșu */
const MAJOR_PATTERNS = [
  /sfintele\s+past/i,
  /\binvier/i,
  /\bcraciunul\b/i,
  /\bnasterea\s+domnului/i,
  /\bajunul\s+craciun/i,
  /\bboboteaz/i,
  /\bbotezul\s+domnului/i,
  /\bpogorarea\s+sfantului\s+duh/i,
  /\bcincizecime/i,
  /\brusalii\b/i,
  /\badormirea\s+maic(ii)?\s+domn/i,
  /\binaltarea\s+domnului/i,
  /\binaltarea\s+sfintei\s+cruci/i,
  /\bbuna\s+vestire/i,
  /\bfloriile\b/i,
  /\bintrarea\s+domnului\b/i,
  /\bintampinarea\s+domnului/i,
  /\bnasterea\s+sfantului\s+ioan\s+botezator/i,
  /\btaierea\s+capului\b/i,
  /\bschimbarea\s+la\s+fata/i,
  /\bsfintii\s+apostoli\s+petru\s+si\s+pavel/i,
  /\bsoborul\s+celor\s+12\s+apostoli/i,
  /\bsfantul\s+apostol\s+andrei\b/i,
  /\bandrei\s+cel\s+intai\s+chemat/i,
  /\banul\s+nou\b/i,
  /\btedeum\b/i,
  /\bziua\s+nationala\b/i,
  /\bacoperamantul\b/i,
  /\bpreasfinta\s+treime\b/i,
  /\bsfanta\s+treime\b/i,
];

/** Sărbători / duminici de praznic — auriu */
const FEAST_PATTERNS = [
  /\bduminica\b/i,
  /\blasatul\s+secului/i,
  /\bajunul\b/i,
  /\bodovania\b/i,
  /\bpraznic/i,
  /\bzi\s+aliturgica/i,
  /\binceputul\s+postului\b/i,
  /\bsarbatoare/i,
  /\btarnosirea\b/i,
  /\bpilda\b/i,
  /\bpredica\s+la\b/i,
];

/**
 * @param {string} summary
 * @returns {EventKind}
 */
export function eventKind(summary) {
  const s = summary.toLowerCase().trim();

  if (s === "post" || s === "harti" || s.startsWith("dezlegare")) {
    return "fasting";
  }

  for (const re of MAJOR_PATTERNS) {
    if (re.test(s)) return "major";
  }

  for (const re of FEAST_PATTERNS) {
    if (re.test(s)) return "feast";
  }

  return "saint";
}

/**
 * Strongest category present on a day (drives cell background).
 * @param {import("./ical-parse.js").CalendarEvent[]} events
 * @returns {EventKind | null}
 */
export function dayTone(events) {
  if (!events.length) return null;
  const kinds = new Set(events.map((e) => eventKind(e.summary)));
  for (const k of KIND_PRIORITY) {
    if (kinds.has(k)) return k;
  }
  return null;
}

