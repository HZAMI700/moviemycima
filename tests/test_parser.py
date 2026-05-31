# flake8: noqa: E402
"""Tests for the HTML metadata parser using saved fixtures."""

import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scraper.parser import parse_metadata


FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"


def load_fixture(name: str) -> str:
    return (FIXTURE_DIR / name).read_text(encoding="utf-8")


def test_parse_movie_jsonld():
    """Full metadata extraction from the test fixture."""
    html = load_fixture("movie_page.html")
    result = parse_metadata(html, "https://wecima.bid/movie/test-film")
    assert result is not None
    assert result["title"] == "Test Movie"  # from JSON-LD
    assert result["original_title"] == "Original Test Title"
    assert result["content_type"] == "movie"
    assert result["year"] == 2024
    assert result["genres"] == ["Action", "Drama"]
    assert result["rating"] == 8.5
    assert result["description"] == "A great test movie for scraping."
    assert "Actor One" in result["cast"]
    assert "Actor Two" in result["cast"]
    assert result["director"] == "Director Name"
    assert result["poster_image_url"] == "https://cdn.test/poster.jpg"
    assert result["page_url"] == "https://wecima.bid/movie/test-film"
    assert "discovered_at" in result
    assert len(result["breadcrumbs"]) >= 2


def test_parse_missing_fields():
    """Parser should not crash when JSON-LD is absent."""
    html = "<html><body><h1>Untitled</h1><p>Some text.</p></body></html>"
    result = parse_metadata(html, "https://wecima.bid/page")
    assert result is not None
    assert result["title"] == "Untitled"
    assert result["page_url"] == "https://wecima.bid/page"


def test_parse_jsonld_rating():
    """Rating extraction from JSON-LD."""
    html = load_fixture("movie_page.html")
    result = parse_metadata(html, "https://wecima.bid/test")
    assert result["rating"] == 8.5


def test_parse_invalid_html():
    """Parser handles garbage HTML."""
    result = parse_metadata("<not>valid<", "https://wecima.bid/test")
    assert result is not None


def test_parse_opengraph_fallback():
    """When JSON-LD absent, OG tags are used."""
    html = """
    <html>
    <head>
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Desc">
      <meta property="og:image" content="https://cdn.test/og.jpg">
    </head>
    <body></body>
    </html>
    """
    result = parse_metadata(html, "https://wecima.bid/movie/og-test")
    assert result["title"] == "OG Title"
    assert result["description"] == "OG Desc"
    assert result["poster_image_url"] == "https://cdn.test/og.jpg"
