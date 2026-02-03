import json
from pathlib import Path

from .settings import settings

AVAILABLE_MODELS = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
]


def _model_path() -> Path:
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "model.json"


def load_model() -> str:
    path = _model_path()
    if not path.exists():
        save_model(settings.gemini_model)
        return settings.gemini_model
    payload = json.loads(path.read_text())
    return payload.get("model", settings.gemini_model)


def save_model(model: str) -> None:
    path = _model_path()
    path.write_text(json.dumps({"model": model}, indent=2))
