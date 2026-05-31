"""HTML metadata parser using Scrapling's Selector with multi-layered fallback."""

import json
import re
import logging
from datetime import datetime, timezone
from urllib.parse import urljoin

from scrapling.parser import Selector

logger = logging.getLogger(__name__)


def parse_metadata(html: str, page_url: str) -> dict | None:
    """Extract metadata from page HTML. Returns dict or None if non-content page."""
    sel = Selector(html)
    if not _is_content_page(sel, page_url):
        return None

    result = {
        "page_url": page_url,
        "discovered_at": datetime.now(timezone.utc).isoformat(),
    }

    # 1) JSON-LD first (richest source)
    _parse_json_ld(sel, result)

    # 2) OpenGraph / Twitter meta tags
    _parse_opengraph(sel, result)

    # 3) CSS/XPath fallback for missing fields
    _parse_fallback(sel, page_url, result)

    # Clean up None values
    return {k: v for k, v in result.items() if v is not None}


def _is_content_page(sel: Selector, url: str) -> bool:
    """Quick heuristic: skip if page is clearly not a content detail page."""
    # Skip if contains login/register forms predominantly
    body_text = (sel.css("body::text").getall() or [])
    body_text = " ".join(body_text).strip()
    if len(body_text) < 20 and not sel.css(".movie, .series, .post, .entry, article"):
        # Might be a thin listing page — still OK to try
        pass
    return True


def _parse_json_ld(sel: Selector, result: dict):
    """Extract from <script type="application/ld+json"> blocks."""
    scripts = sel.css('script[type="application/ld+json"]::text').getall()
    for raw in scripts:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        # Handle @graph arrays
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            _extract_jsonld_item(item, result)
            # Handle @graph within
            for sub in item.get("@graph") or []:
                if isinstance(sub, dict):
                    _extract_jsonld_item(sub, result)


def _extract_jsonld_item(item: dict, result: dict):
    typ = (item.get("@type") or "").lower()
    if "movie" in typ or "film" in typ:
        result.setdefault("content_type", "movie")
    elif "tvseries" in typ or "series" in typ:
        result.setdefault("content_type", "series")
    elif "episode" in typ or "tvseason" in typ:
        result.setdefault("content_type", "episode")

    result.setdefault("title", item.get("name"))
    result.setdefault("description", item.get("description"))
    result.setdefault("rating", _safe_float(item.get("aggregateRating", {}).get("ratingValue")))
    result.setdefault("year", _extract_year(item.get("datePublished") or item.get("dateCreated")))

    # Genres
    genres = item.get("genre") or item.get("keywords")
    if genres:
        if isinstance(genres, str):
            genres = [g.strip() for g in genres.split(",")]
        result.setdefault("genres", genres)

    # Image
    img = item.get("image")
    if img:
        if isinstance(img, dict):
            img = img.get("url")
        result.setdefault("poster_image_url", img)

    # Cast / actors
    actor_list = item.get("actor") or []
    if actor_list:
        names = []
        for a in actor_list:
            if isinstance(a, dict):
                names.append(a.get("name", ""))
            elif isinstance(a, str):
                names.append(a)
        result.setdefault("cast", names)

    # Director
    director_val = item.get("director")
    if isinstance(director_val, list) and director_val:
        d = director_val[0]
        result.setdefault("director", d.get("name") if isinstance(d, dict) else d)
    elif isinstance(director_val, dict):
        result.setdefault("director", director_val.get("name"))
    elif isinstance(director_val, str):
        result.setdefault("director", director_val)

    # SameAs / URL
    result.setdefault("original_title", item.get("alternativeName") or item.get("sameAs"))

    # Breadcrumbs
    if typ == "breadcrumblist" or "@graph" in str(item):
        bc = item.get("itemListElement") or []
        crumbs = []
        for b in bc:
            if isinstance(b, dict):
                name = b.get("name") or b.get("item", {}).get("name")
                if name:
                    crumbs.append(name)
        if crumbs:
            result.setdefault("breadcrumbs", crumbs)


def _parse_opengraph(sel: Selector, result: dict):
    """Extract from OpenGraph and Twitter meta tags."""
    meta_map = {
        "og:title": "title",
        "twitter:title": "title",
        "og:description": "description",
        "twitter:description": "description",
        "og:image": "poster_image_url",
        "twitter:image": "poster_image_url",
        "og:type": "content_type",
        "og:locale": "language",
        "og:site_name": "category",
    }
    for prop, field in meta_map.items():
        if result.get(field):
            continue
        val = sel.css(f'meta[property="{prop}"]::attr(content)').get() or \
              sel.css(f'meta[name="{prop}"]::attr(content)').get()
        if val:
            if field == "content_type":
                val = "movie" if "movie" in val.lower() or "video" in val.lower() else val
            result.setdefault(field, val)


def _parse_fallback(sel: Selector, page_url: str, result: dict):
    """CSS/XPath fallback selectors for missing fields."""
    base_url = page_url.rsplit("/", 1)[0] if "/" in page_url else page_url

    if not result.get("title"):
        h1 = sel.css("h1::text").get()
        if h1:
            result["title"] = h1.strip()
        else:
            title_tag = sel.css("title::text").get()
            if title_tag:
                result["title"] = title_tag.strip().split("|")[0].strip()

    if not result.get("description"):
        desc = sel.css('meta[name="description"]::attr(content)').get()
        if desc:
            result["description"] = desc.strip()

    if not result.get("poster_image_url"):
        for selector in [
            "img.poster",
            ".poster img",
            ".cover img",
            ".thumbnail img",
            ".entry-image img",
            "article img[src*='poster']",
            "img[src*='poster']",
            "img.wp-post-image",
        ]:
            src = sel.css(f"{selector}::attr(src)").get()
            if src:
                result["poster_image_url"] = urljoin(base_url, src)
                break

    if not result.get("genres"):
        genre_links = sel.css(
            '.genres a, .genre a, .categories a, '
            '.tags a, [class*="genre"] a, [class*="category"] a'
        )
        texts = []
        for el in genre_links:
            t = el.css("::text").get()
            if t:
                texts.append(t.strip())
        if texts:
            result["genres"] = texts

    if not result.get("rating"):
        for selector in [
            ".rating span", ".rating", "[class*='rating']",
            ".imdb-rating", ".star-rating",
        ]:
            val = sel.css(f"{selector}::text").get()
            if val:
                parsed = _safe_float(val)
                if parsed:
                    result["rating"] = parsed
                    break

    if not result.get("year"):
        for selector in [
            ".year", "[class*='year']", ".date",
            'time[datetime]', ".release-date",
        ]:
            val = sel.css(f"{selector}::text").get()
            if val:
                y = _extract_year(val)
                if y:
                    result["year"] = y
                    break

    if not result.get("cast"):
        for selector in [
            ".cast a", ".actors a", "[class*='cast'] a",
            "[class*='actor'] a", ".stars a",
        ]:
            names = []
            for el in sel.css(selector):
                t = el.css("::text").get()
                if t:
                    names.append(t.strip())
            if names:
                result["cast"] = names
                break

    if not result.get("quality"):
        for selector in [
            ".quality", "[class*='quality']",
            ".badge", "[class*='hd']",
        ]:
            val = sel.css(f"{selector}::text").get()
            if val:
                result["quality"] = val.strip()
                break

    if not result.get("content_type"):
        ct = _infer_type_from_page(sel, page_url)
        if ct:
            result["content_type"] = ct

    # Breadcrumbs
    if not result.get("breadcrumbs"):
        crumbs = []
        for el in sel.css(".breadcrumb li, .breadcrumbs li, [class*='breadcrumb'] li"):
            t = el.css("::text").get()
            if t:
                crumbs.append(t.strip())
        if crumbs:
            result["breadcrumbs"] = crumbs

    # Director
    if not result.get("director"):
        for selector in [".director a", "[class*='director'] a", ".director span"]:
            val = sel.css(f"{selector}::text").get()
            if val:
                result["director"] = val.strip()
                break

    # Language
    if not result.get("language"):
        for selector in [".language", "[class*='language']", ".lang"]:
            val = sel.css(f"{selector}::text").get()
            if val:
                result["language"] = val.strip()
                break


def _infer_type_from_page(sel: Selector, url: str) -> str | None:
    """Guess content type from page patterns."""
    from scraper.utils import extract_content_type_from_url
    ct = extract_content_type_from_url(url)
    if ct:
        return ct
    # Look for series-specific elements
    if sel.css(".episodes, .season, #episodes, [class*='season']"):
        return "series"
    if sel.css(".video-embed, .player, iframe[src*='embed']"):
        return "movie"
    return None


def _safe_float(val: any) -> float | None:
    try:
        f = float(re.sub(r"[^\d.]", "", str(val)))
        return f if 0 <= f <= 10 else None
    except (ValueError, TypeError):
        return None


def _extract_year(val: str | None) -> int | None:
    if not val:
        return None
    match = re.search(r"\b(19\d{2}|20\d{2})\b", str(val))
    return int(match.group(1)) if match else None
