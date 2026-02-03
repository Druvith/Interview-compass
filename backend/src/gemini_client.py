import time
from pathlib import Path

from google import genai
from google.genai import errors

from .models import AnalysisResult, PromptConfig
from .settings import settings


def build_prompt(prompt: PromptConfig) -> str:
    rubric_text = "\n".join(f"- {label}" for label in prompt.rubric)
    return (
        f"{prompt.prompt_text}\n\n"
        "Rubric categories:\n"
        f"{rubric_text}\n\n"
        "Return JSON that matches the provided schema exactly."
    )


def analyze_video(video_path: Path, prompt: PromptConfig, model: str) -> AnalysisResult:
    client = genai.Client(api_key=settings.effective_api_key)
    try:
        uploaded = client.files.upload(file=video_path)
    except errors.APIError as exc:
        raise RuntimeError(f"Gemini upload failed: {exc}") from exc
    deadline = time.time() + settings.file_ready_timeout_seconds
    while True:
        try:
            file_obj = client.files.get(name=uploaded.name)
        except errors.APIError as exc:
            raise RuntimeError(f"Gemini file status failed: {exc}") from exc
        state = getattr(file_obj, "state", None)
        state_name = getattr(state, "name", state)
        if state_name == "ACTIVE":
            uploaded = file_obj
            break
        if time.time() > deadline:
            raise RuntimeError("Uploaded video not ready in time")
        time.sleep(settings.file_ready_poll_interval_seconds)
    content = [uploaded, build_prompt(prompt)]

    try:
        response = client.models.generate_content(
            model=model,
            contents=content,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": AnalysisResult.model_json_schema(),
            },
        )
    except errors.APIError as exc:
        raise RuntimeError(f"Gemini generate failed: {exc}") from exc

    if not response.text:
        raise RuntimeError("Empty response from Gemini")

    result = AnalysisResult.model_validate_json(response.text)

    try:
        client.files.delete(name=uploaded.name)
    except Exception:
        pass

    return result
