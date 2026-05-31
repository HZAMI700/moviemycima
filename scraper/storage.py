"""Storage — writes merged JSON files to public/data/ for the frontend.

Output files:
  catalog.json       — all items
  movies.json        — items where content_type == "movie"
  series.json        — items where content_type == "series"
  latest.json        — newest 20 items by discovered_at
  search-index.json  — lightweight {id, title, original_title, content_type, year, poster_image_url}
"""

import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

SEARCH_FIELDS = {"id", "title", "original_title", "content_type", "year", "poster_image_url", "page_url", "genres"}


class StaticStorage:
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._items: dict[str, dict] = {}  # keyed by page_url

        # Load existing data on init
        self._load_existing()

    def _load_existing(self):
        catalog_path = self.output_dir / "catalog.json"
        if catalog_path.exists():
            try:
                with open(catalog_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for item in data.get("items", []):
                    url = item.get("page_url")
                    if url:
                        self._items[url] = item
                logger.info("Loaded %d existing items from catalog.json", len(self._items))
            except (json.JSONDecodeError, Exception) as e:
                logger.warning("Failed to load existing catalog.json: %s", e)

    def save(self, record: dict):
        page_url = record.get("page_url", "")
        if not page_url:
            return
        # Merge: keep old fields if new record does not override them
        existing = self._items.get(page_url, {})
        existing.update(record)
        existing["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._items[page_url] = existing

    def flush(self):
        """Write all output JSON files."""
        all_items = list(self._items.values())
        # Deduplicate by page_url just in case
        seen: set[str] = set()
        unique: list[dict] = []
        for item in all_items:
            url = item.get("page_url", "")
            if url not in seen:
                seen.add(url)
                unique.append(item)

        movies = [i for i in unique if i.get("content_type") == "movie"]
        series = [i for i in unique if i.get("content_type") == "series"]
        # Sort by discovered_at descending for latest
        sorted_all = sorted(unique, key=lambda x: x.get("discovered_at", ""), reverse=True)
        latest = sorted_all[:20]

        timestamp = datetime.now(timezone.utc).isoformat()

        self._write_json("catalog.json", {"total": len(unique), "updated_at": timestamp, "items": unique})
        self._write_json("movies.json", {"total": len(movies), "updated_at": timestamp, "items": movies})
        self._write_json("series.json", {"total": len(series), "updated_at": timestamp, "items": series})
        self._write_json("latest.json", {"total": len(latest), "updated_at": timestamp, "items": latest})

        # Search index — only lightweight fields
        search_items = []
        for item in unique:
            si = {k: item.get(k) for k in SEARCH_FIELDS if item.get(k) is not None}
            # Add titleAr / nameAr if available
            for arabic_key in ("titleAr", "nameAr", "title_ar"):
                if item.get(arabic_key):
                    si["titleAr"] = item[arabic_key]
                    break
            search_items.append(si)
        self._write_json("search-index.json", {"total": len(search_items), "updated_at": timestamp, "items": search_items})
        logger.info("Flushed %d items → %d movies, %d series, %d search", len(unique), len(movies), len(series), len(search_items))

    def _write_json(self, filename: str, data: dict):
        path = self.output_dir / filename
        tmp = path.with_suffix(".tmp")
        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            tmp.replace(path)
            logger.debug("Written %s (%d items)", filename, data.get("total", 0))
        except Exception as e:
            logger.error("Failed to write %s: %s", filename, e)
