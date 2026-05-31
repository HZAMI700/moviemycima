"""Storage backend: JSONL (append), CSV (final export), SQLite (deduplicated)."""

import json
import csv
import sqlite3
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class Storage:
    """Write extracted metadata to JSONL, CSV, and SQLite."""

    def __init__(self, jsonl_path: str, csv_path: str, sqlite_path: str, no_sqlite: bool = False):
        self.jsonl_path = Path(jsonl_path)
        self.csv_path = Path(csv_path)
        self.sqlite_path = Path(sqlite_path) if not no_sqlite else None
        self._fieldnames: list[str] | None = None
        self._count = 0

        # Ensure parent directories
        for p in [self.jsonl_path, self.csv_path]:
            p.parent.mkdir(parents=True, exist_ok=True)
        if self.sqlite_path:
            self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_sqlite()

    def _init_sqlite(self):
        self._conn = sqlite3.connect(str(self.sqlite_path))
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                page_url TEXT PRIMARY KEY,
                title TEXT,
                original_title TEXT,
                content_type TEXT,
                year INTEGER,
                genres TEXT,
                category TEXT,
                language TEXT,
                country TEXT,
                quality TEXT,
                rating REAL,
                description TEXT,
                cast TEXT,
                director TEXT,
                breadcrumbs TEXT,
                poster_image_url TEXT,
                discovered_at TEXT
            )
        """)
        self._conn.commit()

    def save(self, record: dict):
        """Save one record to JSONL (append) and SQLite (upsert)."""
        # Normalize
        rec = dict(record)
        self._count += 1

        # JSONL append
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        # CSV: track fieldnames for later export
        if self._fieldnames is None:
            self._fieldnames = list(rec.keys())
        else:
            for k in rec:
                if k not in self._fieldnames:
                    self._fieldnames.append(k)

        # SQLite upsert
        if self.sqlite_path:
            self._sqlite_upsert(rec)

    def _sqlite_upsert(self, rec: dict):
        row = {
            "page_url": rec.get("page_url", ""),
            "title": rec.get("title"),
            "original_title": rec.get("original_title"),
            "content_type": rec.get("content_type"),
            "year": rec.get("year"),
            "genres": json.dumps(rec.get("genres") or [], ensure_ascii=False) if isinstance(rec.get("genres"), list) else rec.get("genres"),
            "category": rec.get("category"),
            "language": rec.get("language"),
            "country": rec.get("country"),
            "quality": rec.get("quality"),
            "rating": rec.get("rating"),
            "description": rec.get("description"),
            "cast": json.dumps(rec.get("cast") or [], ensure_ascii=False) if isinstance(rec.get("cast"), list) else rec.get("cast"),
            "director": rec.get("director"),
            "breadcrumbs": json.dumps(rec.get("breadcrumbs") or [], ensure_ascii=False) if isinstance(rec.get("breadcrumbs"), list) else rec.get("breadcrumbs"),
            "poster_image_url": rec.get("poster_image_url"),
            "discovered_at": rec.get("discovered_at", datetime.now(timezone.utc).isoformat()),
        }
        try:
            self._conn.execute("""
                INSERT OR REPLACE INTO metadata
                (page_url, title, original_title, content_type, year, genres, category,
                 language, country, quality, rating, description, cast, director,
                 breadcrumbs, poster_image_url, discovered_at)
                VALUES
                (:page_url, :title, :original_title, :content_type, :year, :genres, :category,
                 :language, :country, :quality, :rating, :description, :cast, :director,
                 :breadcrumbs, :poster_image_url, :discovered_at)
            """, row)
            self._conn.commit()
        except Exception as e:
            logger.error("SQLite insert error: %s", e)

    def export_csv(self):
        """Write all collected records to CSV at the end of the crawl."""
        if not self._fieldnames:
            logger.warning("No records to export to CSV")
            return
        # Read back from JSONL to ensure complete data
        with open(self.jsonl_path, "r", encoding="utf-8") as fin:
            records = [json.loads(line) for line in fin if line.strip()]

        if not records:
            return

        # Union of all fieldnames
        all_keys = set()
        for r in records:
            all_keys.update(r.keys())
        fieldnames = sorted(all_keys)

        with open(self.csv_path, "w", newline="", encoding="utf-8-sig") as fout:
            writer = csv.DictWriter(fout, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
        logger.info("CSV exported: %d rows -> %s", len(records), self.csv_path)

    @property
    def count(self) -> int:
        return self._count
