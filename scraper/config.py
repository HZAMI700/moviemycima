"""Configuration: environment variables + CLI args."""

import os
import json
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class Config:
    start_url: str = "https://wecima.bid"
    max_pages: int = 500
    max_depth: int = 3
    delay_min: float = 2.0
    delay_max: float = 5.0
    output_jsonl: str = "data/output.jsonl"
    output_csv: str = "data/output.csv"
    output_sqlite: str = "data/metadata.sqlite"
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    )
    allowed_domains: list = field(default_factory=lambda: ["wecima.bid"])
    sitemap_url: str | None = None
    verbose: bool = False
    no_sqlite: bool = False

    @classmethod
    def from_env_and_args(cls, cli_args: dict | None = None) -> "Config":
        cfg = cls()
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

        _map = {
            "START_URL": "start_url",
            "MAX_PAGES": "max_pages",
            "MAX_DEPTH": "max_depth",
            "REQUEST_DELAY_MIN": "delay_min",
            "REQUEST_DELAY_MAX": "delay_max",
            "OUTPUT_JSONL": "output_jsonl",
            "OUTPUT_CSV": "output_csv",
            "OUTPUT_SQLITE": "output_sqlite",
            "USER_AGENT": "user_agent",
        }
        for env_key, attr in _map.items():
            val = os.environ.get(env_key)
            if val is not None:
                try:
                    setattr(cfg, attr, json.loads(val) if val.replace(".", "", 1).replace("-", "", 1).isdigit() else val)
                except (json.JSONDecodeError, ValueError):
                    setattr(cfg, attr, val)

        if cli_args:
            for key, val in cli_args.items():
                if val is not None and hasattr(cfg, key):
                    setattr(cfg, key, val)
        return cfg

    def ensure_dirs(self):
        for p in [self.output_jsonl, self.output_csv, self.output_sqlite]:
            Path(p).parent.mkdir(parents=True, exist_ok=True)
