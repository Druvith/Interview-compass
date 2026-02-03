import json
from datetime import datetime, timezone
from pathlib import Path

from .settings import settings


def _cache_path() -> Path:
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "cache.json"


def load_cache() -> dict:
    path = _cache_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}


def save_cache(cache: dict) -> None:
    path = _cache_path()
    path.write_text(json.dumps(cache, indent=2))


def get_cached_result(key: str) -> dict | None:
    cache = load_cache()
    return cache.get(key)


def set_cached_result(key: str, model: str, analysis: dict) -> None:
    cache = load_cache()
    cache[key] = {
        "model": model,
        "analysis": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    save_cache(cache)
