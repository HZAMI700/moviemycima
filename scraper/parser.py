"""HTML metadata parser — JSON-LD → OpenGraph → Twitter → CSS/XPath fallback."""

import json
import re
import logging
from datetime import datetime, timezone
from urllib.parse import urljoin

from scrapling.parser import Selector

logger = logging.getLogger(__name__)


def parse_metadata(html: str, page_url: str) -> dict | None:
    """Extract public metadata. Returns dict or None."""
    sel = Selector(html)
    result: dict = {
        "page_url": page_url,
        "source_domain": _extract_domain(page_url),
        "discovered_at": datetime.now(timezone.utc).isoformat(),
    }

    _parse_json_ld(sel, result)
    _parse_opengraph(sel, result)
    _parse_twitter(sel, result)
    _parse_fallback(sel, page_url, result)
    _clean_result(result)
    return result if result.get("title") else None


def _extract_domain(url: str) -> str:
    from urllib.parse import urlparse
    return urlparse(url).hostname or ""


def _parse_json_ld(sel: Selector, result: dict):
    scripts = sel.css('script[type="application/ld+json"]::text').getall()
    for raw in scripts:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else ([data] if isinstance(data, dict) else [])
        for item in items:
            if not isinstance(item, dict):
                continue
            _extract_ld(item, result)
            for sub in item.get("@graph") or []:
                if isinstance(sub, dict):
                    _extract_ld(sub, result)


def _extract_ld(item: dict, result: dict):
    typ = (item.get("@type") or "").lower()
    if any(t in typ for t in ("movie", "film")):
        result.setdefault("type", "movie")
    elif any(t in typ for t in ("tvseries", "tvseason", "series")):
        result.setdefault("type", "series")
    elif "episode" in typ:
        result.setdefault("type", "episode")
    elif "breadcrumblist" in typ:
        crumbs = []
        for b in item.get("itemListElement") or []:
            if isinstance(b, dict):
                name = b.get("name") or b.get("item", {}).get("name")
                if name:
                    crumbs.append(name)
        if crumbs:
            result.setdefault("breadcrumbs", crumbs)
            result.setdefault("category", crumbs[-1] if len(crumbs) > 1 else crumbs[0])
        return

    result.setdefault("title", item.get("name"))
    result.setdefault("original_title", item.get("alternativeName"))
    result.setdefault("description", item.get("description"))
    result.setdefault("rating", _safe_float(item.get("aggregateRating", {}).get("ratingValue")))

    date = item.get("datePublished") or item.get("dateCreated")
    if date:
        y = _extract_year(str(date))
        if y:
            result.setdefault("year", y)

    genres = item.get("genre") or item.get("keywords")
    if genres:
        if isinstance(genres, str):
            genres = [g.strip() for g in genres.split(",")]
        result.setdefault("genres", [g for g in genres if g])

    img = item.get("image")
    if isinstance(img, dict):
        img = img.get("url")
    if img and isinstance(img, str):
        result.setdefault("poster_image_url", img)

    for role, field in [("actor", "cast"), ("director", "director")]:
        vals = item.get(role)
        if isinstance(vals, list):
            names = []
            for v in vals:
                if isinstance(v, dict):
                    names.append(v.get("name", ""))
                elif isinstance(v, str):
                    names.append(v)
            names = [n for n in names if n]
            if names:
                if field == "director":
                    result.setdefault("director", names[0])
                else:
                    result.setdefault("cast", names)
        elif isinstance(vals, dict):
            name = vals.get("name")
            if name:
                result.setdefault("director", name)

    duration_raw = item.get("duration")
    if duration_raw:
        result.setdefault("duration", _format_duration(str(duration_raw)))


def _parse_opengraph(sel: Selector, result: dict):
    mapping = {
        "og:title": "title",
        "og:description": "description",
        "og:image": "poster_image_url",
        "og:type": "type",
        "og:locale": "language",
        "og:site_name": "category",
    }
    for prop, field in mapping.items():
        if result.get(field):
            continue
        val = sel.css(f'meta[property="{prop}"]::attr(content)').get()
        if not val:
            val = sel.css(f'meta[name="{prop}"]::attr(content)').get()
        if val:
            if field == "type":
                val = "movie" if "movie" in val.lower() or "video" in val.lower() else val
            result.setdefault(field, val)


def _parse_twitter(sel: Selector, result: dict):
    mapping = {
        "twitter:title": "title",
        "twitter:description": "description",
        "twitter:image": "poster_image_url",
    }
    for prop, field in mapping.items():
        if result.get(field):
            continue
        val = sel.css(f'meta[name="{prop}"]::attr(content)').get()
        if val:
            result.setdefault(field, val)


def _parse_fallback(sel: Selector, page_url: str, result: dict):
    base = page_url.rsplit("/", 1)[0] if "/" in page_url else page_url

    if not result.get("title"):
        h1 = sel.css("h1::text").get()
        if h1:
            result["title"] = h1.strip()
        else:
            t = sel.css("title::text").get()
            if t:
                result["title"] = t.strip().split("|")[0].strip().split(" -")[0].strip()

    if not result.get("description"):
        d = sel.css('meta[name="description"]::attr(content)').get()
        if d:
            result["description"] = d.strip()

    if not result.get("poster_image_url"):
        for s in ["img.poster", ".poster img", ".cover img", ".thumbnail img", "article img[src*='poster']", "img[src*='poster']"]:
            src = sel.css(f"{s}::attr(src)").get()
            if src:
                result["poster_image_url"] = urljoin(base, src)
                break

    if not result.get("genres"):
        texts = []
        for el in sel.css('.genres a, .genre a, .categories a, .tags a, [class*="genre"] a, [class*="category"] a'):
            t = el.css("::text").get()
            if t:
                texts.append(t.strip())
        if texts:
            result["genres"] = texts

    if not result.get("rating"):
        for s in [".rating span", ".rating", "[class*='rating']", ".imdb-rating"]:
            v = sel.css(f"{s}::text").get()
            if v:
                r = _safe_float(v)
                if r:
                    result["rating"] = r
                    break

    if not result.get("year"):
        for s in [".year", "[class*='year']", ".date", 'time[datetime]']:
            v = sel.css(f"{s}::text").get()
            if v:
                y = _extract_year(v)
                if y:
                    result["year"] = y
                    break

    if not result.get("cast"):
        for s in [".cast a", ".actors a", "[class*='cast'] a", "[class*='actor'] a"]:
            names = [el.css("::text").get() for el in sel.css(s)]
            names = [n.strip() for n in names if n and n.strip()]
            if names:
                result["cast"] = names
                break

    if not result.get("director"):
        for s in [".director a", "[class*='director'] a", ".director span"]:
            v = sel.css(f"{s}::text").get()
            if v and v.strip():
                result["director"] = v.strip()
                break

    if not result.get("quality"):
        for s in [".quality", "[class*='quality']", ".badge"]:
            v = sel.css(f"{s}::text").get()
            if v and v.strip():
                result["quality"] = v.strip()
                break

    if not result.get("duration"):
        for s in [".duration", "[class*='duration']", ".runtime"]:
            v = sel.css(f"{s}::text").get()
            if v and v.strip():
                result["duration"] = v.strip()
                break

    if not result.get("language"):
        for s in [".language", "[class*='language']", ".lang"]:
            v = sel.css(f"{s}::text").get()
            if v and v.strip():
                result["language"] = v.strip()
                break

    if not result.get("country"):
        for s in [".country", "[class*='country']"]:
            v = sel.css(f"{s}::text").get()
            if v and v.strip():
                result["country"] = v.strip()
                break

    if not result.get("breadcrumbs"):
        crumbs = []
        for el in sel.css(".breadcrumb li, .breadcrumbs li, [class*='breadcrumb'] li, nav a"):
            t = el.css("::text").get()
            if t and t.strip():
                crumbs.append(t.strip())
        if crumbs:
            result["breadcrumbs"] = crumbs
            result.setdefault("category", crumbs[-1] if len(crumbs) > 1 else crumbs[0])

    if not result.get("type"):
        from scraper.url_filters import classify_url
        result["type"] = classify_url(page_url)


def _safe_float(val) -> float | None:
    try:
        f = float(re.sub(r"[^\d.]", "", str(val)))
        return round(f, 1) if 0 <= f <= 10 else None
    except (ValueError, TypeError):
        return None


def _extract_year(val: str) -> int | None:
    m = re.search(r"\b(19\d{2}|20\d{2})\b", str(val))
    return int(m.group(1)) if m else None


def _format_duration(iso: str) -> str:
    m = re.search(r"PT?(\d+H)?(\d+M)?", iso)
    if not m:
        return iso
    h = m.group(1)[:-1] if m.group(1) else ""
    m = m.group(2)[:-1] if m.group(2) else ""
    if h and m:
        return f"{h}h {m}m"
    if h:
        return f"{h}h"
    if m:
        return f"{m}m"
    return iso


def _clean_result(result: dict):
    """Remove empty / None fields and trim strings."""
    for k in list(result.keys()):
        v = result[k]
        if v is None or v == "" or v == []:
            del result[k]
        elif isinstance(v, str):
            result[k] = v.strip()[:2000]
