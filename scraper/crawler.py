#!/usr/bin/env python3
"""No-backend metadata scraper for wecima.bid — GitHub Actions ready.

Crawls the site, extracts all metadata (including streaming, embed, and
download URLs found on pages), and writes static JSON files to
client/public/data/ for the frontend to consume.

Usage:
    python -m scraper.crawler
    python -m scraper.crawler --max-pages 200 --max-depth 3
    python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml
"""

import sys
import logging
import argparse
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from scrapling.parser import Selector

from scraper.config import Config
from scraper.robots_check import RobotsChecker
from scraper.url_filters import normalize_url, should_crawl
from scraper.parser import parse_metadata
from scraper.storage import StaticStorage
from scraper import utils

logger = logging.getLogger("scraper")

_http = httpx.Client(timeout=30.0, follow_redirects=True)


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


def fetch_page(url: str, config: Config, client: httpx.Client | None = None) -> tuple[str | None, int]:
    c = client or _http
    for attempt in range(config.retry_attempts):
        try:
            resp = c.get(
                url,
                headers={"User-Agent": config.user_agent},
            )
            if 200 <= resp.status_code < 400:
                return resp.text, resp.status_code
            if resp.status_code in (429, 503):
                wait = utils.exponential_backoff(attempt)
                logger.warning("HTTP %d for %s — retrying in %.1fs", resp.status_code, url, wait)
                time.sleep(wait)
                continue
            logger.warning("HTTP %d for %s", resp.status_code, url)
            return None, resp.status_code
        except Exception as e:
            wait = utils.exponential_backoff(attempt)
            logger.error("Fetch error for %s (attempt %d/%d): %s", url, attempt + 1, config.retry_attempts, e)
            time.sleep(wait)
    return None, 0


def fetch_sitemap_urls(sitemap_url: str, config: Config) -> set[str]:
    """Recursively fetch sitemap URLs. Handles sitemap indexes and plain sitemaps."""
    urls: set[str] = set()
    html, status = fetch_page(sitemap_url, config)
    if not html:
        return urls
    sel = Selector(html.encode("utf-8"))

    # Check if this is a sitemap index (contains <sitemap><loc>)
    child_sitemaps = sel.css("sitemap loc::text").getall()
    if child_sitemaps:
        for child_url in child_sitemaps:
            child_url = child_url.strip()
            if child_url:
                urls.update(fetch_sitemap_urls(child_url, config))
        return urls

    # Regular sitemap — extract <loc> entries
    locs = sel.css("loc::text").getall()
    for loc in locs:
        urls.add(loc.strip())
    return urls


def crawl_sitemap(urls: list[str], config: Config, storage: StaticStorage) -> int:
    visited: set[str] = set()
    count = 0
    all_urls: set[str] = set()

    for sitemap_url in urls:
        found = fetch_sitemap_urls(sitemap_url, config)
        all_urls.update(found)

    logger.info("Found %d content URLs in sitemap", len(all_urls))

    for loc in all_urls:
        if config.max_pages and count >= config.max_pages:
            break
        normalized = normalize_url(loc)
        if normalized in visited:
            continue
        visited.add(normalized)

        allowed, reason = should_crawl(normalized, config.allowed_domains)
        if not allowed:
            logger.debug("Skipped %s: %s", normalized, reason)
            continue

        utils.random_delay(config.delay_min, config.delay_max)
        html, status = fetch_page(normalized, config)
        if not html:
            continue

        meta = parse_metadata(html, normalized)
        if meta:
            storage.save(meta)
            count += 1
            logger.info("[%d/%d] %s — %s", count, config.max_pages or "∞", meta.get("content_type", "?"), meta.get("title", normalized))
        else:
            logger.debug("No metadata on %s", normalized)

    return count


def crawl_bfs(config: Config, storage: StaticStorage) -> int:
    visited: set[str] = set()
    queue: list[tuple[str, int]] = [(normalize_url(config.start_url), 0)]
    count = 0

    logger.info("BFS crawl from %s (max_depth=%s)", config.start_url, config.max_depth)

    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        while queue and (not config.max_pages or count < config.max_pages):
            url, depth = queue.pop(0)
            if url in visited:
                continue
            if config.max_depth and depth > config.max_depth:
                continue

            allowed, reason = should_crawl(url, config.allowed_domains)
            if not allowed:
                visited.add(url)
                logger.debug("Skip %s: %s", url, reason)
                continue
            visited.add(url)

            utils.random_delay(config.delay_min, config.delay_max)
            html, status = fetch_page(url, config, client)
            if not html:
                continue

            meta = parse_metadata(html, url)
            if meta:
                storage.save(meta)
                count += 1
                logger.info("[%d/%d] %s — %s (depth=%d)", count, config.max_pages or "∞", meta.get("content_type", "?"), meta.get("title", url), depth)
            else:
                logger.debug("No metadata on %s", url)

            if depth < config.max_depth:
                sel = Selector(html)
                links: set[tuple[str, int]] = set()
                for a in sel.css("a[href]"):
                    href = a.css("::attr(href)").get()
                    if href:
                        abs_url = normalize_url(href.strip(), url)
                        a2, _ = should_crawl(abs_url, config.allowed_domains)
                        if a2 and abs_url not in visited:
                            links.add((abs_url, depth + 1))
                existing = {u for u, _ in queue}
                for link in links:
                    if link[0] not in existing:
                        queue.append(link)

            if count > 0 and count % 25 == 0:
                logger.info("Progress: %d pages visited, %d items extracted, %d queued", len(visited), count, len(queue))

    return count


def main():
    parser = argparse.ArgumentParser(
        description="WeCima No-Backend Scraper — outputs static JSON for frontend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m scraper.crawler\n"
            "  python -m scraper.crawler --max-pages 200 --max-depth 3 --verbose\n"
            "  python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml\n"
        ),
    )
    parser.add_argument("--start-url", default=None, help="Start URL")
    parser.add_argument("--max-pages", type=int, default=None, help="Max pages to crawl (default: 500)")
    parser.add_argument("--max-depth", type=int, default=None, help="Max crawl depth (default: 3)")
    parser.add_argument("--delay", type=float, default=None, help="Base delay in seconds (default: 2–5)")
    parser.add_argument("--sitemap", default=None, help="Sitemap URL override")
    parser.add_argument("--output-dir", default=None, help="Output directory for JSON files (default: client/public/data)")
    parser.add_argument("--verbose", action="store_true", help="Debug logging")

    args = parser.parse_args()
    cli = {k: v for k, v in vars(args).items() if v is not None}

    cfg = Config.from_env_and_args(cli)
    setup_logging(cfg.verbose)

    logger.info("=" * 60)
    logger.info("WeCima No-Backend Scraper")
    logger.info("Target: %s", cfg.start_url)
    logger.info("Max pages: %s | Max depth: %s | Output: %s", cfg.max_pages or "unlimited", cfg.max_depth or "unlimited", cfg.output_dir)
    logger.info("=" * 60)

    # 1) Robots check
    checker = RobotsChecker(cfg.start_url, cfg.user_agent)
    checker.check()
    if not checker.is_allowed:
        logger.warning("robots.txt disallows crawling — proceeding anyway (override with --respect-robots)")
    if checker.crawl_delay:
        cfg.delay_min = max(cfg.delay_min, checker.crawl_delay)
        cfg.delay_max = max(cfg.delay_max, cfg.delay_min + 1)
    logger.info("robots.txt: allowed=%s | delay: %.1f–%.1fs | sitemaps: %d", checker.is_allowed, cfg.delay_min, cfg.delay_max, len(checker.sitemaps))

    # 2) Init storage
    storage = StaticStorage(cfg.output_dir)

    # 3) Crawl
    total = 0
    sitemaps = []

    if cfg.sitemap_url:
        sitemaps = [cfg.sitemap_url]
    elif cfg.start_url:
        sitemaps = checker.find_sitemap()

    if sitemaps:
        logger.info("Using sitemap: %s", sitemaps[0])
        total = crawl_sitemap(sitemaps, cfg, storage)
    else:
        logger.info("No sitemap — BFS crawl from homepage")
        total = crawl_bfs(cfg, storage)

    # 4) Flush all JSON output files
    storage.flush()

    # 5) Summary
    out_dir = Path(cfg.output_dir).resolve()
    logger.info("=" * 60)
    logger.info("Crawl complete!")
    logger.info("   Items extracted: %d", total)
    logger.info("   Output directory: %s", out_dir)
    logger.info("   Files:")
    for fname in ["catalog.json", "movies.json", "series.json", "latest.json", "search-index.json"]:
        fp = out_dir / fname
        if fp.exists():
            logger.info("     - %s (%d bytes)", fname, fp.stat().st_size)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
