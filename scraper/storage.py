"""Storage: JSONL append, CSV export, SQLite upsert."""

import json
import csv
import sqlite3
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class Storage:
    def __init__(self, jsonl_path: str, csv_path: str, sqlite_path: str, no_sqlite: bool = False):
        self.jsonl_path = Path(jsonl_path)
        self.csv_path = Path(csv_path)
        self._sqlite_path = Path(sqlite_path) if not no_sqlite else None
        self._count = 0

        for p in [self.jsonl_path, self.csv_path]:
            p.parent.mkdir(parents=True, exist_ok=True)
        if self._sqlite_path:
            self._sqlite_path.parent.mkdir(parents=True, exist_ok=True)
            self._init_sqlite()

    def _init_sqlite(self):
        self._conn = sqlite3.connect(str(self._sqlite_path))
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                page_url TEXT PRIMARY KEY,
                title TEXT,
                original_title TEXT,
                type TEXT,
                year INTEGER,
                genres TEXT,
                language TEXT,
                country TEXT,
                quality TEXT,
                rating REAL,
                duration TEXT,
                description TEXT,
                cast TEXT,
                director TEXT,
                category TEXT,
                breadcrumbs TEXT,
                poster_image_url TEXT,
                source_domain TEXT,
                discovered_at TEXT
            )
        """)
        self._conn.commit()

    def save(self, record: dict):
        self._count += 1
        rec = dict(record)

        # JSONL append
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        # SQLite upsert
        if self._sqlite_path:
            self._sqlite_upsert(rec)

    def _sqlite_upsert(self, rec: dict):
        row = {
            "page_url": rec.get("page_url", ""),
            "title": rec.get("title"),
            "original_title": rec.get("original_title"),
            "type": rec.get("type"),
            "year": rec.get("year"),
            "genres": json.dumps(rec.get("genres") or [], ensure_ascii=False) if isinstance(rec.get("genres"), list) else rec.get("genres"),
            "language": rec.get("language"),
            "country": rec.get("country"),
            "quality": rec.get("quality"),
            "rating": rec.get("rating"),
            "duration": rec.get("duration"),
            "description": rec.get("description"),
            "cast": json.dumps(rec.get("cast") or [], ensure_ascii=False) if isinstance(rec.get("cast"), list) else rec.get("cast"),
            "director": rec.get("director"),
            "category": rec.get("category"),
            "breadcrumbs": json.dumps(rec.get("breadcrumbs") or [], ensure_ascii=False) if isinstance(rec.get("breadcrumbs"), list) else rec.get("breadcrumbs"),
            "poster_image_url": rec.get("poster_image_url"),
            "source_domain": rec.get("source_domain"),
            "discovered_at": rec.get("discovered_at", datetime.now(timezone.utc).isoformat()),
        }
        try:
            self._conn.execute("""
                INSERT OR REPLACE INTO metadata
                (page_url, title, original_title, type, year, genres, language,
                 country, quality, rating, duration, description, cast, director,
                 category, breadcrumbs, poster_image_url, source_domain, discovered_at)
                VALUES
                (:page_url, :title, :original_title, :type, :year, :genres, :language,
                 :country, :quality, :rating, :duration, :description, :cast, :director,
                 :category, :breadcrumbs, :poster_image_url, :source_domain, :discovered_at)
            """, row)
            self._conn.commit()
        except Exception as e:
            logger.error("SQLite error: %s", e)

    def export_csv(self):
        if not self.jsonl_path.exists():
            logger.warning("No JSONL file to export")
            return
        with open(self.jsonl_path, "r", encoding="utf-8") as f:
            records = [json.loads(line) for line in f if line.strip()]
        if not records:
            return
        keys = set()
        for r in records:
            keys.update(r.keys())
        fieldnames = sorted(keys)
        with open(self.csv_path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(records)
        logger.info("CSV exported: %d rows → %s", len(records), self.csv_path)

    @property
    def count(self) -> int:
        return self._count
