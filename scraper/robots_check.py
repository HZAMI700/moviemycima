"""robots.txt fetcher + parser + sitemap discovery via Scrapling."""

import logging
from urllib.parse import urljoin, urlparse
from scrapling.fetchers import Fetcher

logger = logging.getLogger(__name__)


class RobotsChecker:
    def __init__(self, base_url: str, user_agent: str = "*"):
        self.base_url = base_url.rstrip("/")
        self.robots_url = urljoin(self.base_url, "/robots.txt")
        self.sitemaps: list[str] = []
        self._rules: list[tuple[str, str]] = []
        self._crawl_delay: float | None = None
        self._allowed = True
        self._checked = False

    @property
    def is_allowed(self) -> bool:
        return self._allowed

    @property
    def crawl_delay(self) -> float | None:
        return self._crawl_delay

    def check(self) -> bool:
        if self._checked:
            return self._allowed
        self._checked = True
        try:
            resp = Fetcher.get(self.robots_url, timeout=15)
            if resp.status != 200:
                logger.info("robots.txt HTTP %s — assuming full access", resp.status)
                return True
            self._parse(resp.text)
            logger.info(
                "robots.txt OK — %d rules, %d sitemap(s), delay=%s",
                len(self._rules), len(self.sitemaps), self._crawl_delay,
            )
            return True
        except Exception as e:
            logger.warning("robots.txt fetch failed (%s) — allowing crawl", e)
            return True

    def _parse(self, text: str):
        current_agents: list[str] = []
        for raw in text.splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            key, val = key.strip().lower(), val.strip()
            if key == "user-agent":
                current_agents = [val.lower()] if val != "*" else ["*"]
            elif key == "disallow":
                if current_agents:
                    self._rules.append(("disallow", val))
            elif key == "allow":
                if current_agents:
                    self._rules.append(("allow", val))
            elif key == "crawl-delay" and current_agents and ("*" in current_agents):
                try:
                    self._crawl_delay = float(val)
                except ValueError:
                    pass
            elif key == "sitemap":
                self.sitemaps.append(val)

    def is_url_allowed(self, url: str) -> bool:
        path = urlparse(url).path or "/"
        matched = None
        for rule_type, rule_path in self._rules:
            if path.startswith(rule_path):
                matched = (rule_type, rule_path)
        if matched is None:
            return True
        return matched[0] == "allow"

    def find_sitemap(self) -> list[str]:
        self.check()
        if self.sitemaps:
            return self.sitemaps
        for path in ["/sitemap.xml", "/sitemap_index.xml"]:
            try:
                url = urljoin(self.base_url, path)
                resp = Fetcher.get(url, timeout=15)
                if resp.status == 200:
                    self.sitemaps.append(url)
                    logger.info("Discovered sitemap: %s", url)
                    break
            except Exception:
                continue
        return self.sitemaps
