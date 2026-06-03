# Romanian Orthodox Calendar

A personal **pet project**: I got tired of manually adding Orthodox holidays to every calendar I use, so I built this for myself. If you’re mostly in tech and want something similar — an Orthodox calendar as a subscribe-once iCalendar feed — it might be useful for you too.

This project scrapes the Orthodox calendar from CrestinOrtodox.ro, generates a proper `.ics` file, and publishes it so you can subscribe from Apple Calendar, Google Calendar, Outlook, or anything that supports iCalendar feeds.

The calendar updates itself every month — subscribe once and forget about it.

---

## Website (Netlify)

The repo includes a static frontend (`index.html`) that reads `calendar.ics` and shows today’s saints, a month grid, and subscription links.

### Deploy on Netlify

1. Log in at [netlify.com](https://www.netlify.com) → **Add new site** → **Import an existing project**.
2. Connect **GitHub** → choose `romanian-orthodox-calendar`.
3. Build settings (should auto-detect from `netlify.toml`):
   - **Publish directory:** `.` (root)
   - **Build command:** leave empty or use the placeholder from `netlify.toml`
4. Deploy.

Your site will be at `https://<random>.netlify.app` (or your custom domain). The calendar feed is on the same host:

```text
https://<your-site>.netlify.app/calendar.ics
```

### Preview locally

```bash
cd romanian-orthodox-calendar
python3 -m http.server 8080
```

Open http://localhost:8080 (ES modules require a local server, not `file://`).

### Language (RO / EN)

On first visit, the UI language follows the **browser / device language list**: if any preferred locale is Romanian (`ro`, `ro-RO`, `ro-MD`, …), the site opens in **Romanian**; otherwise **English**. Calendar event titles stay in Romanian (source data). Tapping **RO** or **EN** saves a choice in `localStorage` (`roc-calendar-lang`) and overrides auto-detection on later visits.

---

## Traffic & analytics (maximum data)

The site can send **rich usage data** to tools you control. Combine all three for the fullest picture.

| Tool | What you get | Who sees it |
|------|----------------|-------------|
| **Google Analytics 4** | Visits, geography, devices, traffic sources, custom events, funnels | You + Google (per their terms) |
| **Microsoft Clarity** | Heatmaps, scroll maps, **session recordings**, rage clicks | You + Microsoft (free) |
| **Plausible** | Simple pageviews + events, lightweight dashboard | You + Plausible |
| **Netlify Analytics** | Server page hits (incl. `/calendar.ics` downloads) | Only you (Netlify dashboard) |

### 1. Enable in `index.html`

```html
<html
  lang="ro"
  data-ga-measurement-id="G-XXXXXXXXXX"
  data-clarity-id="your-clarity-project-id"
  data-plausible-domain="your-site.netlify.app"
>
```

Leave a field empty to skip that provider. **Nothing runs on `localhost`.**

### 2. Google Analytics 4 (most data)

1. [analytics.google.com](https://analytics.google.com) → create property → **Web** stream.
2. Copy **Measurement ID** (`G-…`) into `data-ga-measurement-id`.
3. In GA4: **Admin → Data collection** — turn on enhanced measurement (scrolls, outbound clicks, etc.).
4. View **Reports**, **Explore**, **Advertising** (if linked).

### 3. Microsoft Clarity (behavior you can watch)

1. [clarity.microsoft.com](https://clarity.microsoft.com) → add project → copy **Project ID**.
2. Set `data-clarity-id="…"`.
3. Watch real user sessions, clicks, and dead clicks.

### 4. Plausible (optional extra)

1. [plausible.io](https://plausible.io) → add site domain → `data-plausible-domain="…"`.

### 5. Netlify (feed + page hits, no code)

Netlify dashboard → **Analytics** on your site (tracks all HTTP requests).

### Events tracked automatically (production)

| Event | When |
|--------|------|
| `site_context` | First load (screen size, referrer, UTM params) |
| `calendar_loaded` | ICS parsed successfully |
| `calendar_load_error` | Feed failed |
| `view_month` | Month shown (matrix, arrows, today) |
| `select_day` | Day clicked on grid |
| `copy_feed_link` / `copy_webcal_link` | Subscribe URL copied |
| `subscribe_apple_calendar` / `google` / `outlook` | Platform button |
| `share_feed_link` | Native share |
| `download_ics` | `.ics` link clicked |
| `language_change` | RO ↔ EN |
| `outbound_click` | External link (e.g. CrestinOrtodox.ro) |
| `session_end` | Time on site (seconds) when tab hidden |
| `header_subscribe_click` | Header CTA |
| `subscribe_help_open` | Help accordion opened |

Each event includes page URL, language, viewport, referrer, and UTM tags when present.

### Cookie banner (built in)

If you set any analytics ID in `index.html`, visitors in production see a **cookie bar** at the bottom:

- **Accept toate** — loads GA4, Clarity, Plausible and starts tracking.
- **Doar esențiale** — calendar works normally; **no** analytics scripts.
- **Setări cookie** (footer) — reopen the bar and change choice.

Choice is stored in `localStorage` (`roc-cookie-consent`). On `localhost` the banner is hidden (dev mode).

A **privacy policy** is at [`/privacy.html`](privacy.html) (RO/EN). It explains that analytics are only for seeing how many people use the calendar and roughly where they are from — linked from the cookie banner and footer.

#### Quick setup checklist

1. Add analytics IDs to `<html>` (GA4, Clarity, etc.).
2. Deploy to Netlify.
3. Visit the live site — banner appears on first visit.
4. Click **Accept** yourself once to verify GA/Clarity receive data.
5. Review [`privacy.html`](privacy.html) and update the “Last updated” date if you change what you collect.

#### Without analytics IDs

If all `data-ga-measurement-id`, `data-clarity-id`, and `data-plausible-domain` are **empty**, no banner appears and nothing is tracked.

---

## Subscribe

Once GitHub Pages or Netlify is live, the calendar feed will be available at:

```text
https://<USERNAME>.github.io/<REPOSITORY>/calendar.ics
```

Replace `<USERNAME>` and `<REPOSITORY>` with your own GitHub details.

### Apple Calendar

* Open Calendar
* Add Calendar Subscription
* Paste the URL above
* Set refresh interval to Weekly or Monthly

### Google Calendar

* Open Google Calendar
* Other Calendars → From URL
* Paste the feed URL
* Add Calendar

### Outlook

* Add Calendar
* Subscribe from Web
* Paste the feed URL

Done.

---

## How it works

The website only keeps a rolling set of months available. As older months disappear, newer ones get added.

For example:

```text
May 2026 disappears
May 2027 appears
```

Because of that, this project doesn't scrape fixed years.

Instead it always grabs the next 12 months starting from the current month.

Example:

```text
June 2026
July 2026
August 2026
...
May 2027
```

Every month the calendar gets rebuilt automatically with the latest data.

---

## Scraping

The scraper:

* Uses a browser-like session
* Retries failed requests
* Waits between requests
* Continues even if a month fails
* Removes duplicate events
* Preserves Romanian diacritics
* Creates all-day calendar entries

It extracts things such as:

* Major feasts
* Saints
* Orthodox holidays
* Fasting periods
* Food dispensations
* Other liturgical observances

Everything ends up in a standard `.ics` file.

---

## Automatic Updates

GitHub Actions runs automatically on the first day of every month.

```yaml
cron: "0 5 1 * *"
```

Workflow:

```text
GitHub Action starts
        ↓
Scrape latest 12 months
        ↓
Generate calendar.ics
        ↓
Commit changes
        ↓
Push to GitHub
        ↓
GitHub Pages serves updated feed
        ↓
Your calendar refreshes automatically
```

No manual work required.

---

## GitHub Pages Setup

1. Push the repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose your main branch
5. Select root (`/`)
6. Save

A few minutes later the calendar feed should be live.

---

## Run Locally

Create a virtual environment:

```bash
python3.12 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Generate the calendar:

```bash
python scrape.py
```

Output:

```text
calendar.ics
```

---

## Project Structure

```text
romanian-orthodox-calendar/
├── index.html          # frontend (Netlify / static host)
├── css/style.css
├── js/app.js
├── js/ical-parse.js
├── netlify.toml
├── scrape.py
├── requirements.txt
├── calendar.ics
├── README.md
├── .nojekyll
└── .github/workflows/update-calendar.yml
```

---

## Dependencies

| Package         | What it's used for            |
| --------------- | ----------------------------- |
| requests        | Fetching pages                |
| beautifulsoup4  | Parsing HTML                  |
| python-dateutil | Rolling 12-month calculations |
| ics             | Calendar generation           |

---

## Data Source

All calendar information comes from:

https://www.crestinortodox.ro/calendar-ortodox/

This project is not affiliated with CrestinOrtodox.ro or the Romanian Orthodox Church.

If you're relying on dates for church events, fasting rules or feast days, always double-check with your local parish.

---

## Why?

Because every year I ended up searching for the same Orthodox holidays again and manually adding them to whichever calendar I happened to be using.

Now I don't have to.
