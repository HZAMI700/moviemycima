# WeCima No-Backend Scraper

A **no-backend** metadata scraper that runs via **GitHub Actions**, extracts movie/series metadata from wecima.bid, and saves static JSON files that your frontend reads directly.

**No backend server required.** No database. No API. Just static JSON served from `public/data/`.

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  GitHub Actions     │ ──► │  client/public/data │ ──► │  Next.js Frontend    │
│  (every 6 hours)    │     │  ├─ catalog.json     │     │  reads /data/*.json  │
│                     │     │  ├─ movies.json      │     │  directly via fetch  │
│  python -m scraper  │     │  ├─ series.json      │     │                      │
│         .crawler    │     │  ├─ latest.json      │     │  npm run dev →       │
│                     │     │  └─ search-index.json │     │  localhost:3000      │
└─────────────────────┘     └─────────────────────┘     └──────────────────────┘
```

- The scraper runs as a **GitHub Action** every 6 hours or on demand.
- It crawls wecima.bid, extracts metadata (title, year, genres, cast, poster, **streaming URLs**, **embed URLs**, **download URLs**, **subtitle URLs**, etc.).
- Output is written to `client/public/data/*.json`.
- The Action **commits changes** back to the repo automatically.
- The Next.js frontend fetches JSON straight from `/data/*.json` — zero backend.

---

## Files

```
├── .github/workflows/scrape.yml    # GitHub Action — runs every 6h
├── scraper/
│   ├── __init__.py
│   ├── config.py                   # Configuration & CLI/Env overrides
│   ├── crawler.py                  # Main entry point (CLI)
│   ├── parser.py                   # 4-layer parser + media link extraction
│   ├── robots_check.py             # robots.txt checker
│   ├── storage.py                  # Writes merged JSON to public/data/
│   ├── url_filters.py              # URL normalization & path filtering
│   └── utils.py                    # Helpers (delay, backoff, ID gen)
├── client/public/data/             # Output JSON files (auto-generated)
│   ├── catalog.json                # All scraped items
│   ├── movies.json                 # Movies only
│   ├── series.json                 # Series only
│   ├── latest.json                 # Newest 20 items
│   └── search-index.json           # Lightweight search data
├── client/src/lib/staticData.ts    # Frontend loader helpers
├── client/src/components/static/   # Example React components
│   ├── StaticMovieGrid.tsx
│   ├── StaticSeriesGrid.tsx
│   ├── SearchBar.tsx
│   └── LatestSection.tsx
├── requirements.txt
├── .env.example
└── README.md
```

---

## Installation

```bash
pip install -r requirements.txt
```

---

## Run the Scraper Locally

```bash
# Default: 500 pages, depth 3
python -m scraper.crawler

# Custom limits
python -m scraper.crawler --max-pages 200 --max-depth 2

# Use sitemap directly
python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml

# Verbose logging
python -m scraper.crawler --verbose

# Custom output directory
python -m scraper.crawler --output-dir client/public/data
```

Output is written to `client/public/data/*.json`. Run `npm run dev` in `client/` to preview.

---

## Run via GitHub Actions

### Manual trigger
1. Go to **Actions** → **Scrape WeCima.bid** → **Run workflow**.
2. Optionally set `max_pages` and `max_depth`.
3. Click **Run workflow**.

### Automatic schedule
The workflow runs **every 6 hours** automatically. It commits updated JSON files to the repo. If no data changed, no commit is made.

---

## How the Frontend Connects

The scraper outputs JSON into `client/public/data/`. Next.js serves files in `public/` at the root, so `/data/catalog.json` is available at `http://localhost:3000/data/catalog.json` (or your production domain).

### Helper functions (`client/src/lib/staticData.ts`)

```ts
import { loadMovies, loadSeries, loadLatest, searchCatalog } from '@/lib/staticData';

// All movies
const { items, total } = await loadMovies();

// All series
const series = await loadSeries();

// Latest 20 items
const latest = await loadLatest();

// Client-side search
const results = await searchCatalog('search query');
```

### Example components

```tsx
import StaticMovieGrid from '@/components/static/StaticMovieGrid';
import StaticSeriesGrid from '@/components/static/StaticSeriesGrid';
import LatestSection from '@/components/static/LatestSection';
import SearchBar from '@/components/static/SearchBar';

export default function HomePage() {
  return (
    <div>
      <SearchBar />
      <LatestSection limit={10} />
      <StaticMovieGrid limit={24} />
      <StaticSeriesGrid limit={24} />
    </div>
  );
}
```

---

## Data Format

Each JSON file follows this structure:

```json
{
  "total": 150,
  "updated_at": "2026-05-31T12:00:00Z",
  "items": [
    {
      "id": "a1b2c3d4e5f6",
      "title": "Example Movie",
      "original_title": "Original Title",
      "content_type": "movie",
      "page_url": "https://wecima.bid/movie/example",
      "year": 2024,
      "genres": ["أكشن", "دراما"],
      "language": "العربية",
      "country": "مصر",
      "quality": "HD",
      "rating": 7.5,
      "duration": "2h 10m",
      "description": "Movie description...",
      "cast": ["Actor 1", "Actor 2"],
      "director": "Director Name",
      "poster_image_url": "https://example.com/poster.jpg",
      "streaming_urls": ["https://example.com/stream.m3u8"],
      "download_urls": ["https://example.com/download.mp4"],
      "embed_urls": ["https://example.com/embed"],
      "subtitle_urls": ["https://example.com/sub.vtt"],
      "breadcrumbs": ["الرئيسية", "أفلام", "أكشن"],
      "category": "أكشن",
      "source_domain": "wecima.bid",
      "discovered_at": "2026-05-31T12:00:00Z",
      "updated_at": "2026-05-31T12:00:00Z"
    }
  ]
}
```

`search-index.json` contains only lightweight fields: `id`, `title`, `original_title`, `titleAr`, `content_type`, `year`, `poster_image_url`, `page_url`, `genres`.

---

## Legal Limitations

- This scraper extracts **publicly available metadata** from wecima.bid.
- It **respects robots.txt** and stops if crawling is disallowed.
- It includes **polite delays** (2–5 seconds between requests).
- It does **not** bypass Cloudflare, CAPTCHA, login, or any protection.
- Streaming/embed/download URLs are extracted **as metadata only** — they are public links found on the page, not generated or bypassed.
- This tool is for **personal/educational use** only. Check the target site's Terms of Service before scraping.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'scrapling'` | Run `pip install -r requirements.txt` |
| `robots.txt blocks crawling` | The site's robots.txt disallows. Respect it. |
| `HTTP 429 Too Many Requests` | Increase delay: `--delay 5` |
| `No metadata extracted` | The site may have changed its HTML structure. Check the parser selectors in `parser.py`. |
| `GitHub Action not committing` | Verify `Actions > General > Workflow permissions` has **Read and write permissions** enabled. |
| `GitHub Action fails on Python` | Ensure `requirements.txt` is in the repo root and the action can install it. |
| `Frontend shows empty data` | Run the scraper locally first to populate `client/public/data/`. |

---

## Commands Summary

```bash
# Install
pip install -r requirements.txt

# Run locally
python -m scraper.crawler --max-pages 200

# Run with sitemap
python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml

# Preview frontend
cd client && npm run dev
```
