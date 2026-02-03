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
            prompt_version="v1",
            prompt_text=(
                "You are an expert interview evaluator. Analyze the candidate's interview video. "
                "Score each rubric category from 1 to 5, provide a concise rationale, "
                "and return an overall summary. "
                "Be fair, specific, and constructive."
            ),
            rubric=[
                "Communication",
                "Structure & clarity",
                "Technical depth",
                "Problem-solving",
                "Confidence",
            ],
        )
        save_prompt(default)
        return default
    payload = json.loads(path.read_text())
    return PromptConfig(**payload)


def save_prompt(prompt: PromptConfig) -> None:
    path = _prompt_path()
    path.write_text(json.dumps(prompt.model_dump(), indent=2))
