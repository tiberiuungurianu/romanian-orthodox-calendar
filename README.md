# Romanian Orthodox Calendar

A personal **pet project**: I got tired of manually adding Orthodox holidays to every calendar I use, so I built this for myself. If you’re mostly in tech and want something similar — an Orthodox calendar as a subscribe-once iCalendar feed — it might be useful for you too.

The site reads `calendar.ics` (scraped from [CrestinOrtodox.ro](https://www.crestinortodox.ro/calendar-ortodox/)) and shows today’s entries, a month grid, and one-click subscribe links. The feed is rebuilt every month via GitHub Actions — subscribe once and forget about it.

**Live site:** [cerulean-buttercream-9a34a2.netlify.app](https://cerulean-buttercream-9a34a2.netlify.app)

---

## What’s on the site

- **Today** + rolling **12-month** grid with color-coded feasts, saints, and fasting
- **Day details** on mobile: bottom sheet with close button and backdrop (no page jump on iOS)
- **RO / EN** UI (browser language on first visit; choice saved in `localStorage`)
- **Subscribe** helpers for Apple Calendar, Google Calendar, Outlook, copy/share, and `.ics` download
- **Dark mode**, scroll-to-top, cookie consent when analytics IDs are configured
- **Privacy policy** at [`/privacy.html`](privacy.html) (RO/EN)

**Design v1.1** — mobile-first layout, bottom sheet for selected days, scroll-to-top, EN labels for event titles in the UI (feed stays Romanian), footer source link.

---

## Subscribe to the feed

**Site:** https://cerulean-buttercream-9a34a2.netlify.app  
**Feed:**

```text
https://cerulean-buttercream-9a34a2.netlify.app/calendar.ics
```

**Apple Calendar** — File → New Calendar Subscription → paste URL → refresh weekly or monthly.

**Google Calendar** — Other calendars → From URL → paste URL.

**Outlook** — Add calendar → Subscribe from web → paste URL.

---

## Try it locally

The frontend is static; ES modules need a local server (not `file://`):

```bash
cd romanian-orthodox-calendar
python3 -m http.server 8080
```

Open http://localhost:8080

To regenerate the feed from the source site:

```bash
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scrape.py            # writes calendar.ics
```

---

## How the data works

The scraper always fetches the **next 12 months** from the current month (not fixed calendar years). When a month drops off the window, a new one is added — e.g. May 2026 out, May 2027 in.

On the **1st of each month** (05:00 UTC), GitHub Actions runs `scrape.py`, commits `calendar.ics`, and pushes to `main`. **Netlify** (or any static host) serves the updated site and feed from the repo root — no build step (`netlify.toml` publishes `.`).

The scraper uses retries, polite delays, deduplication, and preserves Romanian text. Events include major feasts, saints, fasting (`Post`), fish days (`Harti`), dispensations, and other observances.

---

## Project layout

```text
romanian-orthodox-calendar/
├── index.html, privacy.html
├── css/style.css
├── js/                 # app, i18n, theme, consent, analytics, scroll-top, …
├── calendar.ics        # committed by CI
├── scrape.py
├── netlify.toml
├── requirements.txt
└── .github/workflows/update-calendar.yml
```

**Python deps:** `requests`, `beautifulsoup4`, `python-dateutil`, `ics`

---

## Hosting & analytics (if you fork it)

**Deploy:** connect the repo to [Netlify](https://www.netlify.com) (or GitHub Pages). Publish directory: `.` — settings match `netlify.toml`.

**Analytics (optional):** set `data-ga-measurement-id`, `data-clarity-id`, and/or `data-plausible-domain` on the `<html>` tag in `index.html`. Empty = no tracking, no cookie banner. Details and event names are documented in [`privacy.html`](privacy.html). Nothing runs on `localhost`.

---

## Language (RO / EN)

Romanian if the browser prefers `ro` / `ro-RO` / `ro-MD`, otherwise English. **EN** translates UI copy and event titles in the grid/day panel (`Harti` → “Fast-free day”, fish dispensations → “Fish allowed”). The **iCalendar feed** stays Romanian, matching the source.

---

## Data source & disclaimer

Calendar data: [crestinortodox.ro/calendar-ortodox](https://www.crestinortodox.ro/calendar-ortodox/)

Not affiliated with CrestinOrtodox.ro or the Romanian Orthodox Church. For fasting rules and feast days, confirm with your parish.

---

## Why?

Because every year I ended up searching for the same Orthodox holidays again and manually adding them to whichever calendar I happened to be using.

Now I don't have to.
