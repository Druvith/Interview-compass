# Interview Compass (local‑first)

Interview Compass is a local‑first app that analyzes interview videos using Gemini and presents rubric‑based feedback in a clean workspace. The backend handles upload + ffmpeg downscale + Gemini analysis; the frontend focuses on structured scoring, an executive summary, and exportable results.

## What it does
- Upload a video (mp4/mov)
- Choose a Gemini model
- Customize the evaluation rubric
- Receive per‑category scores + rationale
- Read an executive summary
- Export JSON for downstream workflows

## Project layout
```
backend/   FastAPI API (upload, model selection, rubric, analysis)
frontend/  Vite + React UI
```

## How to run
```bash
make dev
```

## Environment
Set one of these in `.env` (repo root or `backend/.env`):
- `GEMINI_API_KEY` (recommended)
- `GOOGLE_API_KEY`

Optional:
- `GEMINI_MODEL` (default: `gemini-2.5-flash`, also configurable via UI)

## Behavior notes
- Local‑first, single‑process design (no queues, no external storage).
- Uploads are stored temporarily and deleted after processing.
- Results may be cached locally by video hash for faster repeat runs.
- `ffmpeg` (and `ffprobe`) must be available in PATH.
