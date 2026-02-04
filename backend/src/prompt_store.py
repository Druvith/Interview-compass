import json
from pathlib import Path

from .models import PromptConfig
from .settings import settings


def _prompt_path() -> Path:
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "prompt.json"


def load_prompt() -> PromptConfig:
    path = _prompt_path()
    if not path.exists():
        default = PromptConfig(
            prompt_version="v2-strict",
            prompt_text=(
                "You are a 'Bar Raiser' interviewer at a top-tier tech company. "
                "Evaluate the candidate strictly. Do not be polite; be analytical and critical. "
                "Scoring Guide: 5=Exceptional (Rare), 4=Strong Hire, 3=Hire (Borderline), 2=No Hire, 1=Strong No Hire. "
                "Look for signals of 'hand-waving', lack of depth, or unstructured thinking. "
                "For each score, cite specific evidence (quotes, body language). "
                "Your summary must be a decisive hiring recommendation."
            ),
            rubric=[
                "Technical Precision",
                "Communication Efficiency",
                "Structural Logic",
                "Signal-to-Noise Ratio",
                "Executive Presence",
            ],
        )
        save_prompt(default)
        return default
    payload = json.loads(path.read_text())
    return PromptConfig(**payload)


def save_prompt(prompt: PromptConfig) -> None:
    path = _prompt_path()
    path.write_text(json.dumps(prompt.model_dump(), indent=2))
