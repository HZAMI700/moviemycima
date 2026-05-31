"""Robots.txt & sitemap checker using Scrapling's Fetcher."""

import logging
from urllib.parse import urljoin, urlparse
from scrapling.fetchers import Fetcher

logger = logging.getLogger(__name__)


class RobotsChecker:
    """Fetch and parse robots.txt, check URL allow/deny, discover sitemap."""

    def __init__(self, base_url: str, user_agent: str = "*"):
        self.base_url = base_url.rstrip("/")
        self.user_agent = user_agent
        self.robots_url = urljoin(self.base_url, "/robots.txt")
        self.sitemaps: list[str] = []
        self._rules: list[tuple[str, str, float | None]] = []  # (type, path, crawl_delay)
        self._crawl_delay: float | None = None
        self._allowed = True
        self._checked = False
        self._error: str | None = None

    @property
    def is_allowed(self) -> bool:
        return self._allowed

    @property
    def crawl_delay(self) -> float | None:
        return self._crawl_delay

    def check(self) -> bool:
        """Fetch robots.txt and parse rules. Returns True if crawling allowed."""
        if self._checked:
            return self._allowed

        self._checked = True
        try:
            resp = Fetcher.get(self.robots_url, timeout=10)
            if resp.status != 200:
                logger.info("robots.txt returned %s — assuming full access", resp.status)
                self._allowed = True
                return True

            text = resp.text
            self._parse(text)
            logger.info(
                "robots.txt OK — %d rules, %d sitemaps, delay=%s",
                len(self._rules),
                len(self.sitemaps),
                self._crawl_delay,
            )
            return True

        except Exception as e:
            logger.warning("Could not fetch robots.txt (%s) — allowing crawl", e)
            self._error = str(e)
            self._allowed = True
            return True

    def _parse(self, text: str):
        """Minimal robots.txt parser — handles User-agent, Disallow, Allow, Crawl-delay, Sitemap."""
        current_agents: list[str] = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            key, val = key.strip().lower(), val.strip()

            if key == "user-agent":
                current_agents = [val.lower()] if val != "*" else ["*"]
            elif key == "disallow":
                for _ua in current_agents:
                    self._rules.append(("disallow", val, None))
            elif key == "allow":
                for _ua in current_agents:
                    self._rules.append(("allow", val, None))
            elif key == "crawl-delay":
                if current_agents and (self._user_agent_matches(current_agents)):
                    try:
                        self._crawl_delay = float(val)
                    except ValueError:
                        pass
            elif key == "sitemap":
                self.sitemaps.append(val)

    def _user_agent_matches(self, agents: list[str]) -> bool:
        return "*" in agents or self.user_agent.lower() in agents

    def is_url_allowed(self, url: str) -> bool:
        """Check a specific URL against parsed robots.txt rules."""
        path = urlparse(url).path
        if not path:
            path = "/"
        matched_rule = None
        for rule_type, rule_path, _ in self._rules:
            if path.startswith(rule_path):
                matched_rule = (rule_type, rule_path)
        if matched_rule is None:
            return True
        return matched_rule[0] == "allow"

    def find_sitemap(self) -> list[str]:
        """Return list of sitemap URLs discovered."""
        self.check()
        if self.sitemaps:
            return self.sitemaps
        # Try common sitemap locations
        common = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap/"]
        for path in common:
            try:
                url = urljoin(self.base_url, path)
                resp = Fetcher.get(url, timeout=10)
                if resp.status == 200:
                    self.sitemaps.append(url)
                    logger.info("Discovered sitemap: %s", url)
                    break
            except Exception:
                continue
        return self.sitemaps
