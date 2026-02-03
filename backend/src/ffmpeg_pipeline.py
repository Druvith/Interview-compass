import json
import shutil
import subprocess
import sys
from pathlib import Path


def ensure_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg not found in PATH")


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def _probe_height(input_path: Path) -> int | None:
    try:
        if shutil.which("ffprobe") is None:
            return None
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=height",
            "-of",
            "json",
            str(input_path),
        ]
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        payload = json.loads(result.stdout.decode("utf-8"))
        streams = payload.get("streams", [])
        if not streams:
            return None
        return int(streams[0].get("height"))
    except Exception:
        return None


def _transcode_libx264(input_path: Path, output_path: Path, height: int) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        f"scale=-2:{height}",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "30",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    _run(cmd)


def _transcode_videotoolbox(input_path: Path, output_path: Path, height: int) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        f"scale=-2:{height}",
        "-c:v",
        "h264_videotoolbox",
        "-b:v",
        "800k",
        "-maxrate",
        "1200k",
        "-bufsize",
        "2400k",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    _run(cmd)


def transcode_for_gemini(input_path: Path, output_path: Path, height: int = 360) -> None:
    ensure_ffmpeg()
    if sys.platform == "darwin":
        try:
            _transcode_videotoolbox(input_path, output_path, height)
            return
        except subprocess.CalledProcessError:
            pass
    _transcode_libx264(input_path, output_path, height)


def should_transcode(input_path: Path, max_height: int = 360, max_size_mb: int = 20) -> bool:
    size_mb = input_path.stat().st_size / (1024 * 1024)
    if size_mb > max_size_mb:
        return True
    if input_path.suffix.lower() not in {".mp4", ".m4v", ".mov"}:
        return True
    height = _probe_height(input_path)
    if height is None:
        return True
    return height > max_height
