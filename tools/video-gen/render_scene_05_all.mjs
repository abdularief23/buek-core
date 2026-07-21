#!/usr/bin/env node
/**
 * Render all Scene 5 segments (5.1, 5.2, 5.3).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const segments = [
  { html: "scene-05-1-intro.html", output: "scene-05-1-intro.mp4", duration: 5 },
  { html: "scene-05-2-architecture.html", output: "scene-05-2-architecture.mp4", duration: 5 },
  { html: "scene-05-3-industries.html", output: "scene-05-3-industries.mp4", duration: 5 },
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

console.log("\nAll Scene 5 segments rendered.");
