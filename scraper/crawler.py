# flake8: noqa: E402
"""WeCima metadata crawler — CLI entry point."""

import sys
import logging
import argparse
import random
import time
from pathlib import Path
from urllib.parse import urljoin

# Ensure project root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapling.fetchers import Fetcher

from scraper.config import Config
from scraper.robots_check import RobotsChecker
from scraper.parser import parse_metadata
from scraper.storage import Storage
from scraper.utils import normalize_url, should_crawl, extract_content_type_from_url

logger = logging.getLogger("scraper")


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    logging.basicConfig(level=level, format=fmt, datefmt="%H:%M:%S")


def fetch_page(url: str, config: Config) -> tuple[str | None, int]:
    """Fetch page HTML using Scrapling's Fetcher. Returns (html, status) or (None, status)."""
    try:
        resp = Fetcher.get(
            url,
            timeout=30,
            stealthy_headers=True,
            headers={"User-Agent": config.user_agent},
        )
        if resp.status and 200 <= resp.status < 400:
            return resp.text, resp.status
        logger.warning("HTTP %d for %s", resp.status, url)
        return None, resp.status or 0
    except Exception as e:
        logger.error("Fetch error for %s: %s", url, e)
        return None, 0


def crawl_sitemap(urls: list[str], config: Config, storage: Storage):
    """Crawl discovered sitemap URLs."""
    visited: set[str] = set()
    count = 0

    for url in urls:
        if config.max_pages and count >= config.max_pages:
            break
        normalized = normalize_url(url)
        if normalized in visited:
            continue

        logger.info("Sitemap URL: %s", url)
        # Fetch sitemap XML, parse <loc> tags
        html, status = fetch_page(url, config)
        if not html:
            continue
        from scrapling.parser import Selector
        sel = Selector(html)
        locs = sel.css("loc::text").getall()
        if not locs:
            locs = sel.css("sitemap loc::text").getall()

        for loc in locs:
            if config.max_pages and count >= config.max_pages:
                break
            loc = loc.strip()
            normalized = normalize_url(loc)
            if normalized in visited:
                continue
            visited.add(normalized)

            allowed, reason = should_crawl(loc, config.allowed_domains)
            if not allowed:
                logger.debug("Skip %s: %s", loc, reason)
                continue

            time.sleep(random.uniform(config.delay_min, config.delay_max))
            html2, status2 = fetch_page(loc, config)
            if not html2:
                continue

            meta = parse_metadata(html2, loc)
            if meta:
                storage.save(meta)
                count += 1
                logger.info("Extracted [%d/%d] %s — %s", count, config.max_pages, meta.get("content_type", "?"), meta.get("title", loc))

    return count


def crawl_homepage(config: Config, storage: Storage):
    """BFS crawl from home page, following internal links."""
    visited: set[str] = set()
    queue: list[tuple[str, int]] = [(normalize_url(config.start_url), 0)]
    count = 0

    logger.info("Starting BFS crawl from %s", config.start_url)

    while queue and (not config.max_pages or count < config.max_pages):
        url, depth = queue.pop(0)
        if url in visited:
            continue
        if config.max_depth and depth > config.max_depth:
            logger.debug("Max depth reached for %s", url)
            continue

        allowed, reason = should_crawl(url, config.allowed_domains)
        if not allowed:
            logger.debug("Skip %s: %s", url, reason)
            visited.add(url)
            continue

        visited.add(url)
        time.sleep(random.uniform(config.delay_min, config.delay_max))

        html, status = fetch_page(url, config)
        if not html:
            continue

        meta = parse_metadata(html, url)
        if meta:
            storage.save(meta)
            count += 1
            logger.info(
                "FOUND [%d/%d] %s — %s (depth=%d)",
                count, config.max_pages,
                meta.get("content_type", "?"),
                meta.get("title", url),
                depth,
            )

        # Extract links for next level
        if depth < config.max_depth:
            from scrapling.parser import Selector
            sel = Selector(html)
            links = set()
            for a in sel.css("a[href]"):
                href = a.css("::attr(href)").get()
                if href:
                    abs_url = normalize_url(href.strip(), url)
                    allowed2, _ = should_crawl(abs_url, config.allowed_domains)
                    if allowed2 and abs_url not in visited:
                        links.add((abs_url, depth + 1))
            queue.extend(links)

        if count % 10 == 0 and count > 0:
            logger.info("Progress: %d pages crawled, %d metadata items", len(visited), count)

    return count


def main():
    parser = argparse.ArgumentParser(
        description="WeCima Metadata Crawler — extract public metadata only",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m scraper.crawler\n"
            "  python -m scraper.crawler --max-pages 50 --max-depth 2\n"
            "  python -m scraper.crawler --sitemap https://wecima.bid/sitemap.xml\n"
        ),
    )
    parser.add_argument("--start-url", default=None, help="Start URL (default: https://wecima.bid)")
    parser.add_argument("--max-pages", type=int, default=None, help="Max pages to crawl")
    parser.add_argument("--max-depth", type=int, default=None, help="Max crawl depth")
    parser.add_argument("--delay", type=float, default=None, help="Base delay between requests (seconds)")
    parser.add_argument("--sitemap", default=None, help="Sitemap URL instead of homepage crawl")
    parser.add_argument("--output", default=None, help="Output JSONL path")
    parser.add_argument("--csv", default=None, help="Output CSV path")
    parser.add_argument("--no-sqlite", action="store_true", help="Skip SQLite output")
    parser.add_argument("--verbose", action="store_true", help="Debug logging")

    args = parser.parse_args()
    cli_dict = {k: v for k, v in vars(args).items() if v is not None}

    config = Config.from_env_and_args(cli_dict)
    config.ensure_dirs()
    setup_logging(config.verbose)

    logger.info("=" * 60)
    logger.info("WeCima Metadata Crawler")
    logger.info("Target: %s", config.start_url)
    logger.info("Max pages: %s, Max depth: %s", config.max_pages or "unlimited", config.max_depth or "unlimited")
    logger.info("=" * 60)

    # 1) Check robots.txt
    checker = RobotsChecker(config.start_url)
    checker.check()
    if not checker.is_allowed:
        logger.error("robots.txt disallows crawling. Exiting.")
        print("[BLOCKED] robots.txt disallows crawling on this site.")
        sys.exit(1)

    logger.info("robots.txt: OK (crawl-delay: %s)", checker.crawl_delay)
    if checker.crawl_delay:
        config.delay_min = max(config.delay_min, checker.crawl_delay)
        config.delay_max = max(config.delay_max, config.delay_min + 1)

    # 2) Initialize storage
    storage = Storage(
        config.output_jsonl,
        config.output_csv,
        config.output_sqlite,
        config.no_sqlite,
    )

    # 3) Start crawling
    total = 0
    sitemap_urls = []

    if config.sitemap_url:
        sitemap_urls = [config.sitemap_url]
    else:
        sitemap_urls = checker.find_sitemap()

    if sitemap_urls:
        logger.info("Using sitemap: %s", sitemap_urls[0])
        total = crawl_sitemap(sitemap_urls, config, storage)
    else:
        logger.info("No sitemap found — crawling from homepage")
        total = crawl_homepage(config, storage)

    # 4) Export CSV
    storage.export_csv()

    # 5) Summary
    from scraper.storage import Path as _Path
    logger.info("=" * 60)
    logger.info("Crawl complete!")
    logger.info("Items extracted: %d", storage.count)
    logger.info("JSONL output: %s", _Path(config.output_jsonl).resolve())
    logger.info("CSV output:   %s", _Path(config.output_csv).resolve())
    if not config.no_sqlite:
        logger.info("SQLite output: %s", _Path(config.output_sqlite).resolve())
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
