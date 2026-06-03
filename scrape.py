#!/usr/bin/env python3
"""
Scrape Romanian Orthodox calendar data from CrestinOrtodox.ro and emit calendar.ics.

The scraper builds a rolling 12-month window from today's date, fetches each month
page, extracts saints, feasts, fasting rules, and liturgical notes, then writes a
standards-compliant iCalendar file for calendar subscriptions.
"""

from __future__ import annotations

import hashlib
import logging
import re
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag
from dateutil.relativedelta import relativedelta
from ics import Calendar, Event
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://www.crestinortodox.ro/calendar-ortodox/"
OUTPUT_PATH = Path(__file__).resolve().parent / "calendar.ics"
REQUEST_DELAY_SECONDS = 1.0
UID_DOMAIN = "romanian-orthodox-calendar.github.io"

CALENDAR_NAME = "Romanian Orthodox Calendar"
CALENDAR_DESCRIPTION = "Source: CrestinOrtodox.ro"

# Romanian month slug used in CrestinOrtodox.ro URLs (year-month).
MONTH_SLUGS: tuple[str, ...] = (
    "ianuarie",
    "februarie",
    "martie",
    "aprilie",
    "mai",
    "iunie",
    "iulie",
    "august",
    "septembrie",
    "octombrie",
    "noiembrie",
    "decembrie",
)

# Fasting / liturgical labels shown in the right column of the calendar table.
FASTING_LABELS: frozenset[str] = frozenset(
    {
        "post",
        "harti",
        "dezlegare la peste",
        "dezlegare la ulei si vin",
        "dezlegare la ulei și vin",
        "dezlegare la pește",
        "dezlegare la peşte",
    }
)

# Strip scripture / liturgy suffixes appended on Sunday rows.
READINGS_SUFFIX_RE = re.compile(
    r"\s*-\s*(?:Ap\.|Ev\.|Ioan|glas|voscr\.).*$",
    re.IGNORECASE,
)

BROWSER_HEADERS: dict[str, str] = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Referer": BASE_URL,
}

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class CalendarEntry:
    """One all-day observance on a specific Gregorian date."""

    event_date: date
    summary: str


# ---------------------------------------------------------------------------
# Rolling window
# ---------------------------------------------------------------------------


def rolling_months(
    start: date | None = None,
    month_count: int = 12,
) -> list[tuple[int, int]]:
    """
    Return (year, month) pairs for a rolling window of *month_count* months.

    The window starts at the month containing *start* (default: today) and
    advances one calendar month at a time using relativedelta.
    """
    if month_count < 1:
        raise ValueError("month_count must be at least 1")

    anchor = start or date.today()
    current = date(anchor.year, anchor.month, 1)
    months: list[tuple[int, int]] = []

    for _ in range(month_count):
        months.append((current.year, current.month))
        current = current + relativedelta(months=1)

    return months


def month_slug(month: int) -> str:
    """Map 1-based month number to the CrestinOrtodox.ro URL slug."""
    if not 1 <= month <= 12:
        raise ValueError(f"Invalid month: {month}")
    return MONTH_SLUGS[month - 1]


def month_page_url(year: int, month: int) -> str:
    """Build the canonical month calendar URL (e.g. …/calendar-ortodox/2026-iunie/)."""
    return urljoin(BASE_URL, f"{year}-{month_slug(month)}/")


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------


def build_session() -> requests.Session:
    """Create a requests session with retries and browser-like headers."""
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)

    retry = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def fetch_month_html(
    session: requests.Session,
    year: int,
    month: int,
) -> str | None:
    """
    Download one month page. Returns HTML or None on failure (logged, not raised).
    """
    url = month_page_url(year, month)
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        response.encoding = response.apparent_encoding or "utf-8"
        return response.text
    except requests.RequestException as exc:
        logger.error("Failed to fetch %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------


def normalize_summary(text: str) -> str:
    """Collapse whitespace for stable duplicate detection."""
    return re.sub(r"\s+", " ", text.strip())


def clean_summary(text: str) -> str:
    """Remove liturgical reading suffixes while preserving feast / saint names."""
    cleaned = READINGS_SUFFIX_RE.sub("", text.strip())
    return normalize_summary(cleaned)


def is_fasting_label(text: str) -> bool:
    return normalize_summary(text).casefold() in FASTING_LABELS


def format_fasting_summary(text: str) -> str:
    """
    Normalize fasting labels for calendar titles.

    Site copy is often lowercase without diacritics; title-case the label for
    readability while keeping Romanian words intact.
    """
    normalized = normalize_summary(text)
    if normalized.casefold() == "post":
        return "Post"
    if normalized.casefold() == "harti":
        return "Harti"
    # Preserve site wording for dezlegare lines; only fix casing of first word.
    if normalized.lower().startswith("dezlegare"):
        return normalized[0].upper() + normalized[1:]
    return normalized


def split_multi_summary(text: str) -> list[str]:
    """Split combined saint lines on semicolons."""
    parts = re.split(r"\s*;\s*", text)
    return [clean_summary(part) for part in parts if clean_summary(part)]


def summaries_from_description_cell(cell: Tag) -> list[str]:
    """
    Extract feast / saint / liturgical titles from a calendar description cell.

    Prefer anchor title attributes (cleaner than visible text with readings).
    """
    anchors = cell.find_all("a", href=True)
    if anchors:
        summaries: list[str] = []
        for anchor in anchors:
            raw = (anchor.get("title") or anchor.get_text(" ", strip=True) or "").strip()
            summaries.extend(split_multi_summary(raw))
        return summaries

    raw = cell.get_text(" ", strip=True)
    if not raw:
        return []
    return split_multi_summary(raw)


def parse_calendar_table(html: str, year: int, month: int) -> list[CalendarEntry]:
    """
    Parse the month table into CalendarEntry rows.

    Rows without a day <th> continue the previous day (e.g. extra Sunday readings).
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="calendar-listing")
    if table is None:
        logger.warning("No calendar table found for %04d-%02d", year, month)
        return []

    entries: list[CalendarEntry] = []
    current_day: int | None = None

    for row in table.find_all("tr"):
        ths = row.find_all("th")
        if ths:
            day_text = ths[0].get_text(strip=True)
            if day_text.isdigit():
                current_day = int(day_text)

        if current_day is None:
            continue

        try:
            event_date = date(year, month, current_day)
        except ValueError:
            logger.warning(
                "Invalid day %s in %04d-%02d — skipping row",
                current_day,
                year,
                month,
            )
            continue

        for cell in row.find_all("td"):
            classes = cell.get("class") or []
            if "calendar-description-rowspan" in classes:
                label = cell.get_text(" ", strip=True)
                if label and is_fasting_label(label):
                    entries.append(
                        CalendarEntry(
                            event_date=event_date,
                            summary=format_fasting_summary(label),
                        )
                    )
                continue

            for summary in summaries_from_description_cell(cell):
                entries.append(CalendarEntry(event_date=event_date, summary=summary))

    return entries


def deduplicate_entries(entries: list[CalendarEntry]) -> list[CalendarEntry]:
    """Drop duplicate (date, summary) pairs while preserving first occurrence order."""
    seen: set[tuple[date, str]] = set()
    unique: list[CalendarEntry] = []

    for entry in entries:
        key = (entry.event_date, normalize_summary(entry.summary))
        if key in seen:
            continue
        seen.add(key)
        unique.append(
            CalendarEntry(event_date=entry.event_date, summary=normalize_summary(entry.summary))
        )

    return unique


# ---------------------------------------------------------------------------
# iCalendar generation
# ---------------------------------------------------------------------------


def event_uid(event_date: date, summary: str) -> str:
    """Stable UID from date + summary for subscription refresh semantics."""
    digest = hashlib.sha256(
        f"{event_date.isoformat()}|{normalize_summary(summary)}".encode("utf-8")
    ).hexdigest()[:32]
    return f"ro-orthodox-{digest}@{UID_DOMAIN}"


def build_ics(entries: list[CalendarEntry], generated_at: datetime | None = None) -> str:
    """Serialize entries to RFC 5545 iCalendar text."""
    stamp = generated_at or datetime.now(timezone.utc)
    cal = Calendar()

    for entry in sorted(entries, key=lambda e: (e.event_date, e.summary)):
        event = Event()
        event.name = entry.summary
        event.begin = entry.event_date
        event.make_all_day()
        event.end = entry.event_date + timedelta(days=1)
        event.uid = event_uid(entry.event_date, entry.summary)
        event.created = stamp
        cal.events.add(event)

    serialized = cal.serialize()
    return inject_calendar_metadata(serialized)


def inject_calendar_metadata(ics_body: str) -> str:
    """Add CALNAME and description after BEGIN:VCALENDAR."""
    lines = ics_body.splitlines()
    out: list[str] = []
    inserted = False

    for line in lines:
        out.append(line)
        if not inserted and line == "BEGIN:VCALENDAR":
            out.append(f"CALNAME:{CALENDAR_NAME}")
            out.append(f"X-WR-CALNAME:{CALENDAR_NAME}")
            out.append(f"X-WR-CALDESC:{CALENDAR_DESCRIPTION}")
            inserted = True

    return "\r\n".join(out) + "\r\n"


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def scrape_window(
    session: requests.Session,
    months: list[tuple[int, int]],
) -> list[CalendarEntry]:
    """Fetch and parse each month; continue on individual month failures."""
    all_entries: list[CalendarEntry] = []

    for index, (year, month) in enumerate(months):
        if index > 0:
            time.sleep(REQUEST_DELAY_SECONDS)

        logger.info("Fetching calendar for %04d-%02d", year, month)
        html = fetch_month_html(session, year, month)
        if html is None:
            continue

        month_entries = parse_calendar_table(html, year, month)
        logger.info("Parsed %d raw entries for %04d-%02d", len(month_entries), year, month)
        all_entries.extend(month_entries)

    return deduplicate_entries(all_entries)


def write_calendar(entries: list[CalendarEntry], path: Path = OUTPUT_PATH) -> None:
    """Write calendar.ics to disk."""
    ics_content = build_ics(entries)
    path.write_text(ics_content, encoding="utf-8")
    logger.info("Wrote %d events to %s", len(entries), path)


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def main() -> int:
    configure_logging()
    months = rolling_months()
    logger.info(
        "Rolling window: %s",
        ", ".join(f"{y}-{month_slug(m)}" for y, m in months),
    )

    session = build_session()
    entries = scrape_window(session, months)

    if not entries:
        logger.error("No calendar entries collected; leaving existing file unchanged")
        return 1

    write_calendar(entries)
    return 0


if __name__ == "__main__":
    sys.exit(main())
