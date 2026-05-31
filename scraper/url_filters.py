"""URL normalization, filtering, and content-type classification.

The crawler SKIPS certain paths to avoid dynamic/auth pages but the
parser still extracts streaming/embed/download links found on pages.
"""

import re
from urllib.parse import urlparse, urlunparse, urljoin


MEDIA_EXTENSIONS = frozenset({
    ".mp4", ".m3u8", ".ts", ".srt", ".vtt", ".mp3",
    ".zip", ".rar", ".7z", ".tar", ".gz", ".avi",
    ".mkv", ".mov", ".wmv", ".flv", ".webm", ".ogg",
    ".exe", ".iso", ".img",
})

SKIP_PATH_PATTERNS = re.compile(
    r"/(watch|download|server|iframe|embed|player|stream|"
    r"ajax|api|login|register|signup|signin|logout|"
    r"account|profile|dashboard|admin|wp-admin|wp-login|"
    r"cart|checkout|subscribe|payment)(/|$|#|\?)",
    re.I,
)


def normalize_url(url: str, base: str | None = None) -> str:
    if base and not url.startswith(("http://", "https://", "ftp://")):
        url = urljoin(base, url)
    parsed = urlparse(url)
    scheme = parsed.scheme.lower() or "https"
    netloc = parsed.netloc.lower()
    path = parsed.path.rstrip("/").lower() or "/"
    query = ""
    if parsed.query:
        params = sorted(parsed.query.split("&"))
        query = "&".join(p for p in params if not p.startswith(("utm_", "ref=")))
    return urlunparse((scheme, netloc, path, parsed.params, query, ""))


def is_same_domain(url: str, allowed_domains: list[str]) -> bool:
    host = urlparse(url).hostname or ""
    return any(host == d or host.endswith("." + d) for d in allowed_domains)


def is_media_file(url: str) -> bool:
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in MEDIA_EXTENSIONS)


def is_skip_path(url: str) -> bool:
    path = urlparse(url).path
    return bool(SKIP_PATH_PATTERNS.search(path))


def should_crawl(url: str, allowed_domains: list[str]) -> tuple[bool, str]:
    if not url or url.startswith("#") or url.startswith("javascript:") or url.startswith("mailto:"):
        return False, "empty_or_js"
    if not is_same_domain(url, allowed_domains):
        return False, "different_domain"
    if is_media_file(url):
        return False, "media_file"
    if is_skip_path(url):
        return False, "skip_path"
    return True, "ok"


def classify_url(url: str) -> str:
    path = urlparse(url).path.lower()
    if re.search(r"/(movie|film|فيلم)/", path):
        return "movie"
    if re.search(r"/(series?|tv|show|مسلسل)/", path):
        return "series"
    if re.search(r"/(episode|حلقة)/", path):
        return "episode"
    if re.search(r"/(category|genre|تصنيف|قسم)/", path):
        return "category"
    return "page"
