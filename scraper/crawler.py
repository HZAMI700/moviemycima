#!/usr/bin/env python3
"""WeCima Metadata Crawler — CLI entry point.

Usage:
    python -m scraper.crawler
    python -m scraper.crawler --max-pages 200 --max-depth 3
    python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml
"""

import sys
import logging
import argparse
import random
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapling.fetchers import Fetcher
from scrapling.parser import Selector

from scraper.config import Config
from scraper.robots_check import RobotsChecker
from scraper.url_filters import normalize_url, should_crawl
from scraper.parser import parse_metadata
from scraper.storage import Storage
from scraper import utils as scraper_utils

logger = logging.getLogger("scraper")


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


def fetch_page(url: str, config: Config) -> tuple[str | None, int]:
    """Fetch page HTML. Returns (html, status_code)."""
    for attempt in range(3):
        try:
            resp = Fetcher.get(
                url,
                timeout=30,
                stealthy_headers=True,
                headers={"User-Agent": config.user_agent},
            )
            if resp.status and 200 <= resp.status < 400:
                return resp.text, resp.status
            if resp.status in (429, 503):
                wait = scraper_utils.exponential_backoff(attempt)
                logger.warning("HTTP %d for %s — retrying in %.1fs", resp.status, url, wait)
                time.sleep(wait)
                continue
            logger.warning("HTTP %d for %s", resp.status, url)
            return None, resp.status or 0
        except Exception as e:
            wait = scraper_utils.exponential_backoff(attempt)
            logger.error("Fetch error for %s (attempt %d/3): %s — waiting %.1fs", url, attempt + 1, e, wait)
            time.sleep(wait)
    return None, 0


def crawl_sitemap(urls: list[str], config: Config, storage: Storage) -> int:
    """Extract URLs from sitemap XML, then crawl each one."""
    visited: set[str] = set()
    count = 0
    hrefs: set[str] = set()

    for sitemap_url in urls:
        html, status = fetch_page(sitemap_url, config)
        if not html:
            continue
        sel = Selector(html)
        locs = sel.css("loc::text").getall()
        if not locs:
            locs = sel.css("sitemap loc::text").getall()
        for loc in locs:
            hrefs.add(loc.strip())

    logger.info("Found %d URLs in sitemap", len(hrefs))

    for loc in hrefs:
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

        scraper_utils.random_delay(config.delay_min, config.delay_max)
        html, status = fetch_page(normalized, config)
        if not html:
            continue

        meta = parse_metadata(html, normalized)
        if meta:
            storage.save(meta)
            count += 1
            logger.info("[%d/%d] %s — %s", count, config.max_pages or "∞", meta.get("type", "?"), meta.get("title", normalized))
        else:
            logger.debug("No metadata on %s", normalized)

    return count


def crawl_bfs(config: Config, storage: Storage) -> int:
    """BFS crawl from start_url following internal links."""
    visited: set[str] = set()
    queue: list[tuple[str, int]] = [(normalize_url(config.start_url), 0)]
    count = 0

    logger.info("BFS crawl from %s (max_depth=%s)", config.start_url, config.max_depth)

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

        scraper_utils.random_delay(config.delay_min, config.delay_max)
        html, status = fetch_page(url, config)
        if not html:
            continue

        meta = parse_metadata(html, url)
        if meta:
            storage.save(meta)
            count += 1
            logger.info("[%d/%d] %s — %s (depth=%d)", count, config.max_pages or "∞", meta.get("type", "?"), meta.get("title", url), depth)
        else:
            logger.debug("No metadata on %s", url)

        # Extract links for next depth level
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
            # Add with BFS ordering
            existing = {u for u, _ in queue}
            for link in links:
                if link[0] not in existing:
                    queue.append(link)

        if count > 0 and count % 25 == 0:
            logger.info("Progress: %d pages visited, %d items extracted, %d queued", len(visited), count, len(queue))

    return count


def main():
    parser = argparse.ArgumentParser(
        description="WeCima Metadata Crawler — metadata-only, respects robots.txt",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m scraper.crawler\n"
            "  python -m scraper.crawler --max-pages 200 --max-depth 3 --verbose\n"
            "  python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml\n"
        ),
    )
    parser.add_argument("--start-url", default=None, help="Start URL")
    parser.add_argument("--max-pages", type=int, default=None, help="Max pages to crawl")
    parser.add_argument("--max-depth", type=int, default=None, help="Max crawl depth")
    parser.add_argument("--delay", type=float, default=None, help="Base delay in seconds")
    parser.add_argument("--sitemap", default=None, help="Sitemap URL")
    parser.add_argument("--output", default=None, help="Output JSONL path")
    parser.add_argument("--csv", default=None, help="Output CSV path")
    parser.add_argument("--no-sqlite", action="store_true", help="Skip SQLite")
    parser.add_argument("--verbose", action="store_true", help="Debug logging")

    args = parser.parse_args()
    cli = {k: v for k, v in vars(args).items() if v is not None}

    cfg = Config.from_env_and_args(cli)
    cfg.ensure_dirs()
    setup_logging(cfg.verbose)

    logger.info("=" * 60)
    logger.info("WeCima Metadata Crawler v1.0")
    logger.info("Target: %s", cfg.start_url)
    logger.info("Max pages: %s | Max depth: %s", cfg.max_pages or "unlimited", cfg.max_depth or "unlimited")
    logger.info("=" * 60)

    # 1) Robots check
    checker = RobotsChecker(cfg.start_url)
    checker.check()
    if not checker.is_allowed:
        logger.error("❌ robots.txt blocks crawling. Exiting.")
        print("\n[BLOCKED] robots.txt disallows crawling on this site. Exiting.\n")
        sys.exit(1)

    if checker.crawl_delay:
        cfg.delay_min = max(cfg.delay_min, checker.crawl_delay)
        cfg.delay_max = max(cfg.delay_max, cfg.delay_min + 1)
    logger.info("robots.txt: OK | delay: %.1f–%.1fs | sitemaps: %d", cfg.delay_min, cfg.delay_max, len(checker.sitemaps))

    # 2) Init storage
    storage = Storage(cfg.output_jsonl, cfg.output_csv, cfg.output_sqlite, cfg.no_sqlite)

    # 3) Crawl
    total = 0
    sitemaps = []

    if cfg.sitemap_url:
        sitemaps = [cfg.sitemap_url]
    else:
        sitemaps = checker.find_sitemap()

    if sitemaps:
        logger.info("Using sitemap: %s", sitemaps[0])
        total = crawl_sitemap(sitemaps, cfg, storage)
    else:
        logger.info("No sitemap — BFS crawl from homepage")
        total = crawl_bfs(cfg, storage)

    # 4) CSV export
    storage.export_csv()

    # 5) Summary
    logger.info("=" * 60)
    logger.info("✅ Crawl complete!")
    logger.info("   Items extracted: %d", storage.count)
    logger.info("   JSONL: %s", Path(cfg.output_jsonl).resolve())
    logger.info("   CSV:   %s", Path(cfg.output_csv).resolve())
    if not cfg.no_sqlite:
        logger.info("   SQLite: %s", Path(cfg.output_sqlite).resolve())
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
