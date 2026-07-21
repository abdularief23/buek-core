#!/usr/bin/env node
/**
 * Render all Scene 8–10 segments (8.1–10.3).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const segments = [
  { html: "scene-08-1-codex.html", output: "scene-08-1-codex.mp4", duration: 5 },
  { html: "scene-08-2-accelerating.html", output: "scene-08-2-accelerating.mp4", duration: 5 },
  { html: "scene-08-3-gpt-codex.html", output: "scene-08-3-gpt-codex.mp4", duration: 5 },
  { html: "scene-09-1-copilot.html", output: "scene-09-1-copilot.mp4", duration: 5 },
  { html: "scene-09-2-conversation.html", output: "scene-09-2-conversation.mp4", duration: 5 },
  { html: "scene-10-1-beyond.html", output: "scene-10-1-beyond.mp4", duration: 5 },
  { html: "scene-10-2-platform.html", output: "scene-10-2-platform.mp4", duration: 5 },
  { html: "scene-10-3-closing.html", output: "scene-10-3-closing.mp4", duration: 5 },
];

for (const seg of segments) {
  console.log(`\n=== Rendering ${seg.output} ===`);
  const result = spawnSync(
    "node",
    [
      path.join(__dirname, "render_scene_05_segment.mjs"),
      "--html", seg.html,
      "--output", seg.output,
      "--duration", String(seg.duration),
      "--fps", "30",
    ],
    { stdio: "inherit", cwd: __dirname },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\nAll Scene 8–10 segments rendered.");
