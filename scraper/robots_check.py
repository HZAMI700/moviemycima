"""robots.txt checker — fetches, parses, checks crawl permission.

Uses httpx instead of Scrapling Fetcher to avoid heavy dependencies.
"""

import logging
from urllib.parse import urlparse, urljoin
import httpx
from scrapling.parser import Selector

logger = logging.getLogger(__name__)


class RobotsChecker:
    def __init__(self, start_url: str, user_agent: str = "Mozilla/5.0 Scraper"):
        parsed = urlparse(start_url)
        self.base = f"{parsed.scheme}://{parsed.netloc}"
        self.robots_url = urljoin(self.base, "/robots.txt")
        self.user_agent = user_agent
        self.is_allowed = True
        self.crawl_delay: float | None = None
        self.sitemaps: list[str] = []
        self._client = httpx.Client(timeout=15.0, follow_redirects=True)

    def check(self) -> bool:
        try:
            resp = self._client.get(
                self.robots_url,
                headers={"User-Agent": self.user_agent},
            )
            if resp.status_code >= 400:
                logger.info("robots.txt not found (%s) — assuming allowed", resp.status_code)
                self.is_allowed = True
                return True

            body = resp.text or ""
            lines = body.splitlines()
            current_agent = None
            for line in lines:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.lower().startswith("user-agent:"):
                    current_agent = line.split(":", 1)[1].strip()
                if current_agent is None:
                    continue
                if current_agent != "*" and current_agent.lower() not in self.user_agent.lower():
                    continue
                if line.lower().startswith("disallow:"):
                    path = line.split(":", 1)[1].strip()
                    if path:
                        self.is_allowed = False
                if line.lower().startswith("crawl-delay:"):
                    try:
                        self.crawl_delay = float(line.split(":", 1)[1].strip())
                    except ValueError:
                        pass
                if line.lower().startswith("sitemap:"):
                    url = line.split(":", 1)[1].strip()
                    if url:
                        self.sitemaps.append(url)

            logger.info("robots.txt: allowed=%s, delay=%s, sitemaps=%d", self.is_allowed, self.crawl_delay, len(self.sitemaps))
            return self.is_allowed
        except Exception as e:
            logger.warning("robots.txt fetch failed (%s) — assuming allowed", e)
            self.is_allowed = True
            return True

    def find_sitemap(self) -> list[str]:
        if self.sitemaps:
            return self.sitemaps
        for path in ["/sitemap.xml", "/sitemap_index.xml", "/sitemap/sitemap.xml"]:
            url = urljoin(self.base, path)
            try:
                resp = self._client.get(url, headers={"User-Agent": self.user_agent})
                if 200 <= resp.status_code < 400:
                    sel = Selector((resp.text or "").encode("utf-8"))
                    locs = sel.css("loc::text").getall()
                    if locs:
                        logger.info("Found sitemap at %s with %d URLs", url, len(locs))
                        return [url]
                    nested = sel.css("sitemap loc::text").getall()
                    if nested:
                        logger.info("Found sitemap index at %s", url)
                        return nested
            except Exception as e:
                logger.debug("Sitemap check %s failed: %s", url, e)
        return []
