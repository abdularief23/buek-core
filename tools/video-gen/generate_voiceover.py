#!/usr/bin/env python3
"""Generate per-scene voiceover MP3 files from voiceover-lines.json using edge-tts."""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Installing edge-tts...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts", "-q"])
    import edge_tts

ROOT = Path(__file__).parent
CONFIG = ROOT / "voiceover-lines.json"
OUT_DIR = ROOT / "voiceover"


async def synthesize(text: str, voice: str, rate: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(out_path))


async def main() -> None:
    config = json.loads(CONFIG.read_text())
    voice = config.get("voice", "en-US-GuyNeural")
    rate = config.get("rate", "+0%")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    generated: list[Path] = []
    for scene in config["scenes"]:
        if scene.get("silent") or not scene.get("text", "").strip():
            print(f"  skip {scene['id']} (silent)")
            continue
        out_path = OUT_DIR / scene["file"]
        print(f"  {scene['id']} → {out_path.name}")
        await synthesize(scene["text"], voice, rate, out_path)
        generated.append(out_path)

    # Concatenate with ffmpeg
    list_file = OUT_DIR / "concat.txt"
    list_file.write_text("\n".join(f"file '{p.name}'" for p in generated))
    full_path = OUT_DIR / "voiceover-full.mp3"
    result = subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_file),
            "-c", "copy", str(full_path),
        ],
        cwd=OUT_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # Re-encode if stream copy fails
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(list_file),
                "-c:a", "libmp3lame", "-q:a", "2", str(full_path),
            ],
            cwd=OUT_DIR,
            check=True,
        )

    print(f"\nDone: {len(generated)} clips → {full_path}")
    for p in generated:
        size_kb = p.stat().st_size / 1024
        print(f"  {p.name} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    asyncio.run(main())
