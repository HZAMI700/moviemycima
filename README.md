# WeCima Metadata Scraper

A safe, metadata-only web crawler for [wecima.bid](https://wecima.bid) built with [Scrapling](https://github.com/D4Vinci/Scrapling).

Extracts only **public metadata** (titles, genres, ratings, descriptions, cast) — never downloads, streams, or exposes copyrighted media.

## Legal & Ethical Notice

This crawler is **metadata-only**. It does **not**:
- Download or stream video/audio files
- Extract m3u8, embed, or iframe URLs
- Bypass Cloudflare, captchas, or login walls
- Access protected or authenticated content
- Violate `robots.txt` directives

**You are responsible** for using this tool in compliance with the target website's ToS and your local laws.

## Installation

```bash
pip install -r requirements.txt
```

Or with fetchers (for Scrapling's advanced features):
```bash
pip install -r requirements.txt
pip install "scrapling[fetchers]"
```

## Usage

### Basic crawl
```bash
python -m scraper.crawler
```

### Custom settings
```bash
python -m scraper.crawler --start-url "https://wecima.bid" --max-pages 50 --max-depth 2 --delay 3 --output data/output.jsonl
```

### Sitemap-first crawl
```bash
python -m scraper.crawler --sitemap "https://wecima.bid/sitemap.xml"
```

### All options
```
--start-url     Starting page URL (default: https://wecima.bid)
--max-pages     Maximum pages to crawl (default: 100)
--max-depth     Maximum crawl depth (default: 2)
--delay         Base delay between requests in seconds (default: 3)
--sitemap       Use sitemap.xml URL instead of homepage crawl
--output        Output JSONL file path (default: data/output.jsonl)
--csv           Output CSV file path (default: data/output.csv)
--no-sqlite     Skip SQLite output
--verbose       Enable debug logging
```

## Output Format

### JSONL (one metadata object per line)
```json
{
  "page_url": "https://wecima.bid/movie/example",
  "title": "Example Movie",
  "original_title": "Original Title",
  "content_type": "movie",
  "year": 2024,
  "genres": ["Action", "Drama"],
  "category": "أفلام أجنبية",
  "language": "Arabic",
  "country": "US",
  "quality": "1080p",
  "rating": 7.5,
  "description": "Movie description text...",
  "cast": ["Actor 1", "Actor 2"],
  "director": "Director Name",
  "breadcrumbs": ["الرئيسية", "أفلام", "أجنبي"],
  "poster_image_url": "https://wecima.bid/.../poster.jpg",
  "discovered_at": "2025-05-31T20:30:00Z"
}
```

### SQLite
Table `metadata` with the same fields. `page_url` is UNIQUE.

### CSV
Same columns, exported at the end of the crawl.

## Project Structure

```
scraper/
  __init__.py
  config.py        # Configuration from env/args
  robots_check.py  # robots.txt & sitemap checker
  crawler.py       # Main CLI entry point
  parser.py        # HTML metadata parser
  storage.py       # JSONL/CSV/SQLite writers
  utils.py         # URL normalization, filtering
data/
  output.jsonl
  output.csv
  metadata.sqlite
tests/
  test_utils.py
  test_parser.py
  fixtures/
    movie_page.html
```

## Fields Extracted

| Field            | Source                                      |
|------------------|---------------------------------------------|
| title            | JSON-LD, OG:title, h1                       |
| original_title   | JSON-LD, meta, specific CSS                 |
| content_type     | URL pattern, breadcrumbs, JSON-LD           |
| year             | JSON-LD, meta, text patterns                |
| genres           | JSON-LD, tag links                          |
| category         | Breadcrumbs, section                        |
| language         | Meta, JSON-LD, detected                     |
| country          | JSON-LD, meta                               |
| quality          | Badge/spans on page                         |
| rating           | JSON-LD, meta, visible rating element       |
| description      | JSON-LD, OG:desc, meta desc                 |
| cast             | JSON-LD, actor links                        |
| director         | JSON-LD, meta                                |
| breadcrumbs      | Breadcrumb JSON-LD or HTML                  |
| poster_image_url | OG:image, JSON-LD image, img tag src        |

## Limitations

- WeCima may change its HTML structure — the parser uses multi-layered fallbacks (JSON-LD → OG → CSS/XPath) to stay resilient.
- Some pages may lack certain metadata fields (e.g., director, original title).
- The site may rate-limit or block aggressive crawling — respect the built-in delays.
- Cloudflare protection may block Scrapling's basic fetcher; the tool falls back gracefully.

## Testing

```bash
pytest tests/ -v
```
