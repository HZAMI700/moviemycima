"""Small utilities: timing, retry helpers."""

import random
import time
import logging

logger = logging.getLogger(__name__)


def random_delay(min_sec: float = 2.0, max_sec: float = 5.0):
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)


def exponential_backoff(attempt: int, base: float = 2.0, max_wait: float = 60.0) -> float:
    return min(base * (2 ** attempt), max_wait)
