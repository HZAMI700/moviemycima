# flake8: noqa: E402
"""Tests for URL normalization and filtering."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scraper.utils import normalize_url, is_same_domain, is_media_url, is_skipped_path, should_crawl


def test_normalize_url():
    assert normalize_url("HTTP://EXAMPLE.COM/Path") == "http://example.com/path"
    assert normalize_url("/movie/test", "https://wecima.bid") == "https://wecima.bid/movie/test"
    n = normalize_url("https://wecima.bid/")
    assert n in ("https://wecima.bid", "https://wecima.bid/")  # trailing slash is acceptable
    # Fragment should be removed
    n = normalize_url("https://wecima.bid/page#section")
    assert "#" not in n


def test_normalize_url_sorts_query():
    n = normalize_url("https://wecima.bid/page?b=2&a=1")
    assert "a=1&b=2" in n


def test_is_same_domain():
    assert is_same_domain("https://wecima.bid/movie", ["wecima.bid"]) is True
    assert is_same_domain("https://www.wecima.bid/movie", ["wecima.bid"]) is True
    assert is_same_domain("https://other.com/movie", ["wecima.bid"]) is False


def test_is_media_url():
    assert is_media_url("https://cdn.com/video.mp4") is True
    assert is_media_url("https://cdn.com/stream.m3u8") is True
    assert is_media_url("https://cdn.com/sub.srt") is True
    assert is_media_url("https://cdn.com/file.zip") is True
    assert is_media_url("https://wecima.bid/movie/test") is False
    assert is_media_url("https://wecima.bid/image.jpg") is False  # images are OK


def test_is_skipped_path():
    assert is_skipped_path("https://wecima.bid/login") is True
    assert is_skipped_path("https://wecima.bid/register") is True
    assert is_skipped_path("https://wecima.bid/embed/123") is True
    assert is_skipped_path("https://wecima.bid/api/movies") is True
    assert is_skipped_path("https://wecima.bid/movie/test") is False


def test_should_crawl():
    domains = ["wecima.bid"]
    # Good URL
    ok, reason = should_crawl("https://wecima.bid/movie/test", domains)
    assert ok is True
    assert reason == "ok"
    # Media file
    ok, reason = should_crawl("https://wecima.bid/video.mp4", domains)
    assert ok is False
    assert reason == "media_file"
    # Different domain
    ok, reason = should_crawl("https://other.com/movie", domains)
    assert ok is False
    assert reason == "different_domain"
    # Blocked path
    ok, reason = should_crawl("https://wecima.bid/login", domains)
    assert ok is False
    assert reason == "blocked_path"
    # Empty
    ok, reason = should_crawl("", domains)
    assert ok is False


def test_extract_content_type():
    from scraper.utils import extract_content_type_from_url
    assert extract_content_type_from_url("https://wecima.bid/movie/test") == "movie"
    assert extract_content_type_from_url("https://wecima.bid/series/test") == "series"
    assert extract_content_type_from_url("https://wecima.bid/مسلسل/test") == "series"
    assert extract_content_type_from_url("https://wecima.bid/aaa") is None
