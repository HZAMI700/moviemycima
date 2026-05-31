# WeCima Metadata Crawler

Metadata-only web crawler for [wecima.bid](https://wecima.bid) built with [Scrapling](https://github.com/D4Vinci/Scrapling).

Extracts **only public metadata** — titles, genres, ratings, descriptions, cast. Never downloads media, streaming URLs, embed links, or protected content.

## Legal & Ethical Limits

**This crawler is metadata-only and:**
- Does **not** extract watching servers, downloading servers, iframe/embed/player URLs, m3u8, mp4, ts, subtitles, or direct media links
- Does **not** bypass Cloudflare, captchas, anti-bot systems, paywalls, or login walls
- Does **not** download posters, images, videos, or subtitles
- **Respects robots.txt** — stops if crawling is disallowed
- Uses polite delays (2–5s) and a clear User-Agent

**You are responsible** for complying with the target website's ToS and your local laws.

## Installation

```bash
pip install -r requirements.txt
```

Optional (for stealth fetcher features):
```bash
pip install "scrapling[fetchers]"
```

## Usage

### Basic crawl (sitemap-first, then BFS)
```bash
python -m scraper.crawler
```

### Custom limits
```bash
python -m scraper.crawler --max-pages 200 --max-depth 3
```

### Use a specific sitemap
```bash
python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml
```

### All options
```
--start-url     Starting URL (default: https://wecima.bid)
--max-pages     Maximum pages to crawl (default: 500)
--max-depth     Maximum crawl depth (default: 3)
--delay         Base delay in seconds (default: 3)
--sitemap       Sitemap URL (skips homepage discovery)
--output        JSONL output path
--csv           CSV output path
--no-sqlite     Disable SQLite storage
--verbose       Enable debug logging
```

## Output

### JSONL (one object per line)
```json
{
  "page_url": "https://wecima.bid/movie/example",
  "title": "Example Movie",
  "original_title": "Original Title",
  "type": "movie",
  "year": 2024,
  "genres": ["Action", "Drama"],
  "language": "Arabic",
  "country": "US",
  "quality": "1080p",
  "rating": 8.5,
  "duration": "2h 15m",
  "description": "Movie description...",
  "cast": ["Actor One", "Actor Two"],
  "director": "Director Name",
  "category": "أفلام أجنبية",
  "breadcrumbs": ["الرئيسية", "أفلام", "أجنبي"],
  "poster_image_url": "https://cdn.example/poster.jpg",
  "source_domain": "wecima.bid",
  "discovered_at": "2025-05-31T20:30:00Z"
}
```

### SQLite
Table `metadata` with same fields. `page_url` is UNIQUE.

### CSV
Exported at end of crawl.

## Project Structure

```
scraper/
├── __init__.py        # Package marker
├── config.py          # Configuration from .env + CLI
├── robots_check.py    # robots.txt & sitemap checker
├── url_filters.py     # URL normalization & filtering
├── parser.py          # 4-layer parser (JSON-LD → OG → Twitter → CSS/XPath)
├── storage.py         # JSONL + CSV + SQLite
├── crawler.py         # CLI entry point (sitemap or BFS)
├── utils.py           # Delay & retry helpers
data/
├── output.jsonl
├── output.csv
└── metadata.sqlite
tests/
├── test_scraper.py    # 18 tests
└── fixtures/
    └── movie_page.html
```

## Fields Extracted

| Field            | Source                                    |
|------------------|-------------------------------------------|
| title            | JSON-LD → OG → Twitter → h1 / title      |
| original_title   | JSON-LD `alternativeName`                 |
| type             | JSON-LD → URL pattern                     |
| year             | JSON-LD `datePublished` → CSS             |
| genres           | JSON-LD `genre` → `.genres a`             |
| language         | OG `locale` → `.language` CSS             |
| country          | `.country` CSS                            |
| quality          | `.quality` CSS                            |
| rating           | JSON-LD `aggregateRating` → `.rating`     |
| duration         | JSON-LD `duration` (ISO→human) → CSS      |
| description      | JSON-LD → OG → meta description           |
| cast             | JSON-LD `actor` → `.cast a`               |
| director         | JSON-LD `director` → `.director a`        |
| category         | Breadcrumbs → OG site_name                |
| breadcrumbs      | BreadcrumbList JSON-LD → `.breadcrumb li` |
| poster_image_url | JSON-LD `image` → OG:image → CSS img src  |
| source_domain    | Parsed from `page_url`                    |
| discovered_at    | UTC timestamp                             |

## URL Filtering Rules

**Skipped paths:** `/watch`, `/download`, `/server`, `/iframe`, `/embed`, `/player`, `/stream`, `/ajax`, `/api`, `/login`, `/register`, `/account`, `/admin`, `/wp-admin`, etc.

**Skipped extensions:** `.mp4`, `.m3u8`, `.ts`, `.srt`, `.vtt`, `.mp3`, `.zip`, `.rar`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`

**Domain-restricted:** Only follows links on `wecima.bid`.

## Testing

```bash
python -m pytest tests/test_scraper.py -v
```

All 18 tests pass.

## Limitations

- WeCima may change its HTML structure — the parser uses 4 fallback layers to stay resilient.
- Some pages may lack certain fields (director, original title, country).
- Cloudflare may block Scrapling's basic fetcher; the tool falls back gracefully.
- Metadata quality depends on what the site exposes on public pages.
