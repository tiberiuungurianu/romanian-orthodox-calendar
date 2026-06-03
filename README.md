# Romanian Orthodox Calendar (iCalendar)

A production-ready pipeline that scrapes the [CrestinOrtodox.ro Orthodox calendar](https://www.crestinortodox.ro/calendar-ortodox/), builds a standards-compliant `.ics` file, and publishes it on **GitHub Pages** for calendar subscriptions.

Subscribe once in Apple Calendar, Google Calendar, Outlook, or any iCalendar client—the feed refreshes automatically every month.

## Subscription URL

After you enable GitHub Pages (see below), use:

```text
https://<USERNAME>.github.io/<REPOSITORY>/calendar.ics
```

Replace `<USERNAME>` and `<REPOSITORY>` with your GitHub account and repository name.

### Apple Calendar (macOS / iOS)

1. Open **Calendar** → **File** → **New Calendar Subscription** (macOS) or **Calendars** → **Add Calendar** → **Add Subscription Calendar** (iOS).
2. Paste the GitHub Pages URL above.
3. Choose refresh interval **Every week** or **Every month** (the file is updated monthly on the server).

### Google Calendar

1. In [Google Calendar](https://calendar.google.com), click **+** next to **Other calendars** → **From URL**.
2. Paste the GitHub Pages URL and click **Add calendar**.

### Outlook

1. Go to **Add calendar** → **Subscribe from web**.
2. Paste the GitHub Pages URL and confirm.

## How it works

### Rolling 12-month window

The scraper does **not** use fixed years. It starts from today’s month and collects the next **12** months via `rolling_months()` (`dateutil.relativedelta`).

Example (today in June 2026): June 2026 → May 2027.

### Scraping (`scrape.py`)

1. Builds a `requests.Session()` with browser-like headers and `urllib3` retries (`429`, `5xx`, backoff).
2. Requests each month at `https://www.crestinortodox.ro/calendar-ortodox/{year}-{luna}/` (e.g. `2026-iunie/`).
3. Waits **1 second** between month requests.
4. Parses the `table.calendar-listing` rows:
   - Saints, feasts, and liturgical titles from description cells (preferring link `title` attributes).
   - Fasting rules from `calendar-description-rowspan` cells (`Post`, `Harti`, `Dezlegare la peste`, etc.).
5. Logs errors and **continues** if a month fails (no crash).
6. Deduplicates events by `(date, summary)`.
7. Writes **`calendar.ics`** with all-day events (`DTSTART` / `DTEND`), `UID`, `SUMMARY`, and `DTSTAMP`.

Calendar metadata:

- **Name:** Romanian Orthodox Calendar  
- **Description:** Source: CrestinOrtodox.ro  

### GitHub Actions

Workflow: [`.github/workflows/update-calendar.yml`](.github/workflows/update-calendar.yml)

| Trigger | When |
|--------|------|
| `cron: "0 5 1 * *"` | 05:00 UTC on the 1st of each month |
| `workflow_dispatch` | Manual run from the Actions tab |

Steps: checkout → Python 3.12 → `pip install -r requirements.txt` → `python scrape.py` → commit `calendar.ics` only if it changed → push.

### GitHub Pages

1. Push this repository to GitHub.
2. **Settings** → **Pages** → **Build and deployment** → Source: **Deploy from a branch**.
3. Branch: **`main`** (or your default), folder: **`/ (root)`**.
4. Save. After a minute, `calendar.ics` is served at the subscription URL above.

The repo includes `.nojekyll` so GitHub Pages serves the raw `.ics` file without Jekyll processing.

## Run locally

Requirements: **Python 3.12**

```bash
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scrape.py
```

Output: `calendar.ics` in the project root.

## Project layout

```text
romanian-orthodox-calendar/
├── scrape.py
├── requirements.txt
├── calendar.ics          # generated; committed for Pages + first subscribe
├── README.md
├── .nojekyll
└── .github/workflows/update-calendar.yml
```

## Dependencies

| Package | Role |
|---------|------|
| `requests` | HTTP client with session + retries |
| `beautifulsoup4` | HTML parsing |
| `python-dateutil` | `relativedelta` for rolling months |
| `ics` | RFC 5545 calendar serialization |

## Data source & disclaimer

Event data is scraped from [CrestinOrtodox.ro](https://www.crestinortodox.ro/calendar-ortodox/) for personal and community use. Verify important feast and fasting dates with your parish or diocese. This project is not affiliated with CrestinOrtodox.ro.

## License

Use and modify freely; attribute CrestinOrtodox.ro as the data source when redistributing the calendar feed.
