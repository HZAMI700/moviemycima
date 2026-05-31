"""URL utilities: normalization, filtering, deduplication."""

import re
from urllib.parse import urlparse, urlunparse, urljoin


MEDIA_EXTENSIONS = frozenset({
    ".mp4", ".m3u8", ".ts", ".srt", ".vtt", ".mp3",
    ".zip", ".rar", ".7z", ".tar", ".gz", ".avi",
    ".mkv", ".mov", ".wmv", ".flv", ".webm", ".ogg",
})

SKIP_PATH_PATTERNS = re.compile(
    r"/(login|register|signup|signin|logout|account|profile|"
    r"dashboard|admin|api|ajax|embed|iframe|player|"
    r"stream|download|wp-admin|wp-login|cart|checkout)(/|$)",
    re.I,
)


def normalize_url(url: str, base: str | None = None) -> str:
    """Normalize a URL: resolve relative, lowercase scheme/host, remove fragment, sort query."""
    if base:
        url = urljoin(base, url)
    parsed = urlparse(url)
    scheme = parsed.scheme.lower() or "https"
    netloc = parsed.netloc.lower()
    path = parsed.path.rstrip("/").lower() or "/"
    # Sort query params for canonical form
    query = ""
    if parsed.query:
        params = sorted(parsed.query.split("&"))
        query = "&".join(params)
    return urlunparse((scheme, netloc, path, parsed.params, query, ""))


def is_same_domain(url: str, allowed_domains: list[str]) -> bool:
    """Check if URL belongs to one of the allowed domains."""
    host = urlparse(url).hostname or ""
    return any(host == d or host.endswith("." + d) for d in allowed_domains)


def is_media_url(url: str) -> bool:
    """Return True if URL points to a media/download file."""
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in MEDIA_EXTENSIONS)


def is_skipped_path(url: str) -> bool:
    """Return True if URL path matches blocked patterns."""
    path = urlparse(url).path
    return bool(SKIP_PATH_PATTERNS.search(path))


def should_crawl(url: str, allowed_domains: list[str]) -> tuple[bool, str]:
    """Check if URL should be crawled. Returns (allowed, reason)."""
    if not url or url.startswith("#") or url.startswith("javascript:"):
        return False, "empty_or_js"
    if not is_same_domain(url, allowed_domains):
        return False, "different_domain"
    if is_media_url(url):
        return False, "media_file"
    if is_skipped_path(url):
        return False, "blocked_path"
    return True, "ok"


def extract_content_type_from_url(url: str) -> str | None:
    """Guess content type from URL path."""
    path = urlparse(url).path.lower()
    if re.search(r"/(movie|film|فيلم)/", path):
        return "movie"
    if re.search(r"/(series?|tv|show|مسلسل)/", path):
        return "series"
    if re.search(r"/(episode|حلقة)/", path):
        return "episode"
    return None
