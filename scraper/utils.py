"""Utilities: random delay, exponential backoff, stable ID generation."""

import random
import time
import hashlib
import logging

logger = logging.getLogger(__name__)


def random_delay(min_sec: float = 2.0, max_sec: float = 5.0):
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)


def exponential_backoff(attempt: int, base: float = 2.0, max_wait: float = 60.0) -> float:
    return min(base * (2 ** attempt) + random.uniform(0, 1), max_wait)


def make_id(page_url: str) -> str:
    raw = page_url.rstrip("/").lower()
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")


import re
