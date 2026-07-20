#!/usr/bin/env python3
"""
Generate Buek Core promo video clips with Gemini Veo.

Supports:
  - Vertex AI + ADC (recommended, no API key)
  - Gemini API key (optional)

Usage:
  cp .env.example .env
  python generate_scene.py --list
  python generate_scene.py --scene scene-01-opening-factory --dry-run
  python generate_scene.py --scene scene-01-opening-factory
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


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name, str(default)).strip().lower()
    return value in {"1", "true", "yes", "on"}


def load_config() -> dict:
    with PROMPTS_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def get_vertex_credentials():
    try:
        import google.auth

        credentials, _ = google.auth.default()
        return credentials, "ADC"
    except Exception:
        import subprocess

        from google.oauth2.credentials import Credentials

        token = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()
        return Credentials(token=token), "gcloud token"


def get_client():
    load_dotenv(ROOT / ".env")

    from google import genai

    if env_bool("USE_VERTEX_AI", False):
        project = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1").strip()
        if not project:
            print("ERROR: Set GOOGLE_CLOUD_PROJECT in tools/video-gen/.env")
            sys.exit(1)
        credentials, auth_mode = get_vertex_credentials()
        print(f"Auth: Vertex AI ({auth_mode}) | project={project} | location={location}")
        return genai.Client(
            vertexai=True,
            project=project,
            location=location,
            credentials=credentials,
            http_options={"api_version": "v1"},
        )

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        print("ERROR: Set USE_VERTEX_AI=true or GEMINI_API_KEY in tools/video-gen/.env")
        sys.exit(1)

    print("Auth: Gemini API key")
    return genai.Client(api_key=api_key)


def build_prompt(scene: dict, character_block: str) -> str:
    return f"{scene['prompt']}\n\n{character_block}"


def download_vertex_video(client, generated, out_file: Path) -> None:
    video = generated.video
    uri = getattr(video, "uri", None) or getattr(video, "gcs_uri", None)
    if uri and uri.startswith("gs://"):
        try:
            from google.cloud import storage

            bucket_name, blob_name = uri.replace("gs://", "").split("/", 1)
            storage.Client().bucket(bucket_name).blob(blob_name).download_to_filename(str(out_file))
            print(f"Downloaded from GCS: {uri}")
            return
        except Exception as error:
            print(f"GCS SDK download failed ({error}), trying gsutil...")

        import subprocess

        subprocess.run(["gsutil", "cp", uri, str(out_file)], check=True)
        print(f"Downloaded via gsutil: {uri}")
        return

    client.files.download(file=video)
    video.save(str(out_file))


def generate_video(scene_id: str, dry_run: bool = False) -> None:
    load_dotenv(ROOT / ".env")
    config = load_config()
    character_block = config["character_block"]
    scene = next((s for s in config["scenes"] if s["id"] == scene_id), None)
    if not scene:
        available = ", ".join(s["id"] for s in config["scenes"])
        print(f"ERROR: Unknown scene '{scene_id}'. Available: {available}")
        sys.exit(1)

    model = os.getenv("VEO_MODEL", "veo-3.1-lite-generate-preview")
    output_dir = Path(os.getenv("OUTPUT_DIR", ROOT / "output"))
    output_dir.mkdir(parents=True, exist_ok=True)

    prompt = build_prompt(scene, character_block)
    out_file = output_dir / f"{scene_id}.mp4"
    gcs_output = os.getenv("GCS_OUTPUT_URI", "").strip()

    print(f"Scene: {scene_id}")
    print(f"Time:  {scene['time']}")
    print(f"Voice: {scene['voice']}")
    print(f"Model: {model}")
    if gcs_output:
        print(f"GCS:   {gcs_output}/{scene_id}/")
    print(f"Prompt:\n{prompt}\n")

    if dry_run:
        print("[dry-run] Skipping API call.")
        return

    from google.genai import types

    client = get_client()

    video_config: dict = {
        "number_of_videos": 1,
        "duration_seconds": scene.get("duration_seconds", 6),
        "aspect_ratio": scene.get("aspect_ratio", "16:9"),
        "resolution": scene.get("resolution", "720p"),
        "negative_prompt": scene.get("negative_prompt"),
    }
    if gcs_output:
        video_config["output_gcs_uri"] = f"{gcs_output.rstrip('/')}/{scene_id}"

    print("Submitting to Veo... (may take 1-3 minutes)")
    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
        config=types.GenerateVideosConfig(**video_config),
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
    download_vertex_video(client, generated, out_file)
    print(f"Saved: {out_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Buek Core video scenes with Veo")
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
