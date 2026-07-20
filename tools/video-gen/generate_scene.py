#!/usr/bin/env python3
"""
Generate Buek Core promo video clips with Gemini Veo API.

Usage:
  pip install -r requirements.txt
  cp .env.example .env   # then add GEMINI_API_KEY
  python generate_scene.py --list
  python generate_scene.py --scene scene-01-opening-factory
  python generate_scene.py --all
  python generate_from_image.py --image ../../docs/images/factory-scene1.jpg --scene scene-01-opening-factory
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


def load_config() -> dict:
    with PROMPTS_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def get_client():
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        print("ERROR: Set GEMINI_API_KEY in tools/video-gen/.env")
        print("Get key: https://aistudio.google.com/apikey")
        sys.exit(1)

    from google import genai

    return genai.Client(api_key=api_key)


def build_prompt(scene: dict, character_block: str) -> str:
    return f"{scene['prompt']}\n\n{character_block}"


def generate_video(scene_id: str, dry_run: bool = False) -> None:
    config = load_config()
    character_block = config["character_block"]
    scene = next((s for s in config["scenes"] if s["id"] == scene_id), None)
    if not scene:
        available = ", ".join(s["id"] for s in config["scenes"])
        print(f"ERROR: Unknown scene '{scene_id}'. Available: {available}")
        sys.exit(1)

    model = os.getenv("VEO_MODEL", "veo-3.1-fast-generate-preview")
    output_dir = Path(os.getenv("OUTPUT_DIR", ROOT / "output"))
    output_dir.mkdir(parents=True, exist_ok=True)

    prompt = build_prompt(scene, character_block)
    out_file = output_dir / f"{scene_id}.mp4"

    print(f"Scene: {scene_id}")
    print(f"Time:  {scene['time']}")
    print(f"Voice: {scene['voice']}")
    print(f"Model: {model}")
    print(f"Prompt:\n{prompt}\n")

    if dry_run:
        print("[dry-run] Skipping API call.")
        return

    from google.genai import types

    client = get_client()

    print("Submitting to Veo... (may take 1-3 minutes)")
    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
        config=types.GenerateVideosConfig(
            number_of_videos=1,
            duration_seconds=scene.get("duration_seconds", 6),
            aspect_ratio=scene.get("aspect_ratio", "16:9"),
            resolution=scene.get("resolution", "720p"),
            negative_prompt=scene.get("negative_prompt"),
            enhance_prompt=True,
        ),
    )

    poll_seconds = 15
    while not operation.done:
        print(f"  waiting... ({poll_seconds}s)")
        time.sleep(poll_seconds)
        operation = client.operations.get(operation)

    if not operation.response or not operation.response.generated_videos:
        print("ERROR: No video returned.")
        print(operation)
        sys.exit(1)

    generated = operation.response.generated_videos[0]
    client.files.download(file=generated.video)
    generated.video.save(str(out_file))
    print(f"Saved: {out_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Buek Core video scenes with Gemini Veo")
    parser.add_argument("--scene", help="Scene id from prompts.json")
    parser.add_argument("--all", action="store_true", help="Generate all scenes")
    parser.add_argument("--list", action="store_true", help="List available scenes")
    parser.add_argument("--dry-run", action="store_true", help="Print prompt without calling API")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    config = load_config()

    if args.list:
        for scene in config["scenes"]:
            print(f"- {scene['id']} ({scene['time']})")
        return

    if args.all:
        for scene in config["scenes"]:
            generate_video(scene["id"], dry_run=args.dry_run)
            print()
        return

    if not args.scene:
        parser.print_help()
        sys.exit(1)

    generate_video(args.scene, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
