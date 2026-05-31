"""Tests for URL filtering, normalization, and parser."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scraper.url_filters import (
    normalize_url,
    is_same_domain,
    is_media_url,
    is_blocked_path,
    should_crawl,
    classify_url,
)
from scraper.parser import parse_metadata


FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"


# ── URL Normalization ──────────────────────────────────────────

def test_normalize_lowercase_scheme():
    assert normalize_url("HTTP://EXAMPLE.COM/Path") == "http://example.com/path"


def test_normalize_relative():
    assert normalize_url("/movie/test", "https://wecima.bid") == "https://wecima.bid/movie/test"


def test_normalize_strips_utm():
    n = normalize_url("https://wecima.bid/page?a=1&utm_source=foo&b=2")
    assert "utm_source" not in n
    assert "a=1&b=2" in n


def test_normalize_no_fragment():
    assert "#" not in normalize_url("https://wecima.bid/page#section")


def test_normalize_deduplicates():
    a = normalize_url("https://wecima.bid/Movie/Test")
    b = normalize_url("https://wecima.bid/movie/test")
    assert a == b


# ── Domain Check ───────────────────────────────────────────────

def test_same_domain():
    assert is_same_domain("https://wecima.bid/movie", ["wecima.bid"])
    assert is_same_domain("https://www.wecima.bid/x", ["wecima.bid"])
    assert not is_same_domain("https://other.com/x", ["wecima.bid"])


# ── Media URL Filter ───────────────────────────────────────────

def test_media_extensions():
    assert is_media_url("https://cdn.com/video.mp4")
    assert is_media_url("https://cdn.com/stream.m3u8")
    assert is_media_url("https://cdn.com/sub.srt")
    assert is_media_url("https://cdn.com/file.zip")
    assert not is_media_url("https://wecima.bid/movie/test")
    assert not is_media_url("https://wecima.bid/image.jpg")


# ── Blocked Path Filter ────────────────────────────────────────

def test_blocked_paths():
    for p in ["/watch", "/download", "/server/1", "/iframe", "/embed",
              "/player", "/stream", "/ajax", "/api/movies", "/login",
              "/register", "/account", "/admin", "/wp-admin"]:
        assert is_blocked_path(f"https://wecima.bid{p}"), f"should block {p}"
    assert not is_blocked_path("https://wecima.bid/movie/test")
    assert not is_blocked_path("https://wecima.bid/series/test")


# ── should_crawl ───────────────────────────────────────────────

def test_should_crawl_ok():
    ok, reason = should_crawl("https://wecima.bid/movie/test", ["wecima.bid"])
    assert ok and reason == "ok"


def test_should_crawl_media():
    ok, reason = should_crawl("https://cdn.com/video.mp4", ["wecima.bid"])
    assert not ok
    assert reason == "different_domain"


def test_should_crawl_blocked():
    ok, reason = should_crawl("https://wecima.bid/download/file", ["wecima.bid"])
    assert not ok
    assert reason == "blocked_path"


def test_should_crawl_empty():
    ok, reason = should_crawl("", ["wecima.bid"])
    assert not ok


# ── classify_url ───────────────────────────────────────────────

def test_classify_movie():
    assert classify_url("https://wecima.bid/movie/test") == "movie"
    assert classify_url("https://wecima.bid/فيلم/اختبار") == "movie"


def test_classify_series():
    assert classify_url("https://wecima.bid/series/test") == "series"
    assert classify_url("https://wecima.bid/مسلسل/اختبار") == "series"


# ── Parser ─────────────────────────────────────────────────────

def load_fixture(name: str) -> str:
    return (FIXTURE_DIR / name).read_text(encoding="utf-8")


def test_parse_full():
    html = load_fixture("movie_page.html")
    result = parse_metadata(html, "https://wecima.bid/movie/test-film")
    assert result is not None
    assert result["title"] == "Test Movie Arabic"
    assert result["original_title"] == "Original Test Title EN"
    assert result["type"] == "movie"
    assert result["year"] == 2024
    assert result["genres"] == ["Action", "Drama", "Thriller"]
    assert result["rating"] == 8.5
    assert "Actor One" in result["cast"]
    assert "Actor Two" in result["cast"]
    assert result["director"] == "Director Name"
    assert result["poster_image_url"]
    assert result["description"]
    assert result["duration"]
    assert result["language"] == "العربية"
    assert result["country"] == "مصر"
    assert result["breadcrumbs"]
    assert result["category"]
    assert result["source_domain"] == "wecima.bid"


def test_parse_no_jsonld():
    html = "<html><body><h1>Only Title</h1><p>Desc</p></body></html>"
    result = parse_metadata(html, "https://wecima.bid/page")
    assert result is not None
    assert result["title"] == "Only Title"


def test_parse_minimal():
    result = parse_metadata("<html></html>", "https://wecima.bid/empty")
    assert result is None or isinstance(result, dict)


def test_parse_duration_iso():
    html = """<html><head><script type="application/ld+json">
    {"@type":"Movie","name":"Test","duration":"PT1H45M"}
    </script></head><body></body></html>"""
    result = parse_metadata(html, "https://wecima.bid/m/t")
    assert result is not None
    assert "1h" in result.get("duration", "")
    assert "45m" in result.get("duration", "")
