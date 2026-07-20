#!/usr/bin/env python3
"""
Image-to-video with Gemini Veo — use your existing Scene 1 still image as reference.

Usage:
  python generate_from_image.py --image path/to/factory.jpg --scene scene-01-opening-factory
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "prompts.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Image-to-video with Gemini Veo")
    parser.add_argument("--image", required=True, help="Source image (JPG/PNG)")
    parser.add_argument("--scene", default="scene-01-opening-factory")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        print("ERROR: Set GEMINI_API_KEY in tools/video-gen/.env")
        sys.exit(1)

    image_path = Path(args.image).resolve()
    if not image_path.exists():
        print(f"ERROR: Image not found: {image_path}")
        sys.exit(1)

    with PROMPTS_FILE.open(encoding="utf-8") as f:
        config = json.load(f)

    scene = next((s for s in config["scenes"] if s["id"] == args.scene), None)
    if not scene:
        print(f"ERROR: Unknown scene: {args.scene}")
        sys.exit(1)

    model = os.getenv("VEO_MODEL", "veo-3.1-fast-generate-preview")
    output_dir = Path(os.getenv("OUTPUT_DIR", ROOT / "output"))
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"{args.scene}-from-image.mp4"

    motion_prompt = (
        f"Animate this factory scene with subtle cinematic motion: {scene.get('camera', 'slow dolly forward')}. "
        "Conveyors move slowly, operators continue working, robotic arms move gently, morning light stays consistent. "
        "Keep all characters and composition the same as the source image."
    )

    print(f"Image:  {image_path}")
    print(f"Scene:  {args.scene}")
    print(f"Motion: {motion_prompt}")

    if args.dry_run:
        print("[dry-run] Skipping API call.")
        return

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    print("Submitting image-to-video...")
    operation = client.models.generate_videos(
        model=model,
        prompt=motion_prompt,
        image=types.Image.from_file(str(image_path)),
        config=types.GenerateVideosConfig(
            number_of_videos=1,
            duration_seconds=scene.get("duration_seconds", 6),
            aspect_ratio=scene.get("aspect_ratio", "16:9"),
            resolution=scene.get("resolution", "720p"),
            negative_prompt=scene.get("negative_prompt"),
        ),
    )

    while not operation.done:
        print("  waiting...")
        time.sleep(15)
        operation = client.operations.get(operation)

    generated = operation.response.generated_videos[0]
    client.files.download(file=generated.video)
    generated.video.save(str(out_file))
    print(f"Saved: {out_file}")


if __name__ == "__main__":
    main()
