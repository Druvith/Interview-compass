import hashlib
import json
import logging
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .cache_store import get_cached_result, set_cached_result
from .ffmpeg_pipeline import should_transcode, transcode_for_gemini
from .gemini_client import analyze_video
from .model_store import AVAILABLE_MODELS, load_model, save_model
from .models import AnalysisResponse, AnalysisResult, PromptConfig
from .prompt_store import load_prompt, save_prompt

app = FastAPI(title="Video Interview Analysis API")
logger = logging.getLogger("uvicorn.error")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/prompt", response_model=PromptConfig)
def get_prompt() -> PromptConfig:
    return load_prompt()


@app.put("/api/prompt", response_model=PromptConfig)
def update_prompt(payload: PromptConfig) -> PromptConfig:
    save_prompt(payload)
    return payload


@app.get("/api/models")
def get_models() -> dict:
    return {"current": load_model(), "available": AVAILABLE_MODELS}


@app.put("/api/models")
def update_model(payload: dict) -> dict:
    model = payload.get("model")
    if not model:
        raise HTTPException(status_code=400, detail="Missing model")
    save_model(model)
    return {"current": model, "available": AVAILABLE_MODELS}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(video: UploadFile = File(...)) -> AnalysisResponse:
    if not video.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    try:
        start_time = time.perf_counter()
        hasher = hashlib.sha256()
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(video.filename).suffix) as raw_file:
            raw_path = Path(raw_file.name)
            while chunk := await video.read(1024 * 1024):
                raw_file.write(chunk)
                hasher.update(chunk)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as out_file:
            processed_path = Path(out_file.name)

        t_after_upload = time.perf_counter()
        prompt = load_prompt()
        model = load_model()
        video_hash = hasher.hexdigest()
        config_hash = hashlib.sha256(
            json.dumps(
                {
                    "prompt_text": prompt.prompt_text,
                    "rubric": prompt.rubric,
                    "model": model,
                    "schema": "analysis-v1",
                },
                sort_keys=True,
            ).encode("utf-8")
        ).hexdigest()
        cache_key = hashlib.sha256(f"{video_hash}:{config_hash}".encode("utf-8")).hexdigest()

        cached = get_cached_result(cache_key)
        if cached:
            t_after_transcode = time.perf_counter()
            t_after_gemini = t_after_transcode
            logger.info(
                "latency upload=%.2fs transcode=%.2fs gemini=%.2fs total=%.2fs cache=hit",
                t_after_upload - start_time,
                0.0,
                0.0,
                t_after_gemini - start_time,
            )
            analysis = AnalysisResult(**cached["analysis"])
            return AnalysisResponse(
                analysis=analysis,
                cached=True,
                model=cached.get("model", model),
                video_hash=video_hash,
            )

        transcode_needed = should_transcode(raw_path)
        if transcode_needed:
            transcode_for_gemini(raw_path, processed_path)
            t_after_transcode = time.perf_counter()
            path_for_analysis = processed_path
        else:
            t_after_transcode = time.perf_counter()
            path_for_analysis = raw_path

        result = analyze_video(path_for_analysis, prompt, model)
        t_after_gemini = time.perf_counter()

        set_cached_result(cache_key, model, result.model_dump())

        logger.info(
            "latency upload=%.2fs transcode=%.2fs gemini=%.2fs total=%.2fs cache=miss",
            t_after_upload - start_time,
            t_after_transcode - t_after_upload,
            t_after_gemini - t_after_transcode,
            t_after_gemini - start_time,
        )
        return AnalysisResponse(analysis=result, cached=False, model=model, video_hash=video_hash)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        try:
            if "processed_path" in locals() and processed_path.exists() and processed_path != raw_path:
                processed_path.unlink()
        except Exception:
            pass
        try:
            if "raw_path" in locals() and raw_path.exists():
                raw_path.unlink()
        except Exception:
            pass
