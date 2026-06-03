# Romanian Orthodox Calendar

I got tired of manually adding Orthodox holidays to every calendar I use, so I built this.

This project scrapes the Orthodox calendar from CrestinOrtodox.ro, generates a proper `.ics` file and publishes it through GitHub Pages so it can be subscribed to from Apple Calendar, Google Calendar, Outlook or pretty much anything that supports iCalendar feeds.

The calendar updates itself every month, so you subscribe once and forget about it.

---

## Subscribe

Once GitHub Pages is enabled, the calendar feed will be available at:

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
