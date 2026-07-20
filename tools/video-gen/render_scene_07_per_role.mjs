#!/usr/bin/env node
/**
 * Scene 7 — one full-screen video per role (not 2×2 grid).
 *
 * Usage:
 *   node render_scene_07_per_role.mjs
 *   node render_scene_07_per_role.mjs --role engineer
 *   node render_scene_07_per_role.mjs --duration 5 --fps 30
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { findChrome, encodeVideo, sleep } from "./lib/video-capture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const FPS = Number(getArg("--fps", "30"));
const DURATION = Number(getArg("--duration", "5"));
const ONLY_ROLE = getArg("--role", "");
const HTML_FILE = "scene-07-role-single.html";
const OUTPUT_DIR = path.join(__dirname, "output");

const ROLES = [
  { key: "operator", file: "scene-07-role-operator.mp4", label: "Operator" },
  { key: "engineer", file: "scene-07-role-engineer.mp4", label: "Engineer" },
  { key: "supervisor", file: "scene-07-role-supervisor.mp4", label: "Supervisor" },
  { key: "manager", file: "scene-07-role-plant-manager.mp4", label: "Plant Manager" },
];

function serveStatic(rootDir) {
  const mime = {
    ".html": "text/html",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const safePath = path.normalize(req.url.split("?")[0]).replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(rootDir, safePath === "/" ? HTML_FILE : safePath.slice(1));
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function renderRole(page, baseUrl, role, totalFrames, frameMs) {
  const framesDir = path.join(OUTPUT_DIR, `frames-scene-07-${role.key}`);
  const outputMp4 = path.join(OUTPUT_DIR, role.file);

  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(framesDir, file));
  }

  const url = `${baseUrl}/${HTML_FILE}?role=${role.key}`;
  console.log(`  Rendering ${role.label}...`);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForFunction(
    () => document.querySelector(".ui-main h2")?.textContent?.length > 0,
    { timeout: 20000 },
  );
  await sleep(800);

  for (let i = 0; i < totalFrames; i += 1) {
    const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
    await page.screenshot({ path: framePath, type: "png" });
    if (i < totalFrames - 1) await sleep(frameMs);
  }

  encodeVideo({ framesDir, outputMp4, fps: FPS, totalFrames });
  const stats = fs.statSync(outputMp4);
  console.log(`    → ${role.file} (${(stats.size / 1024).toFixed(0)} KB)`);
  return outputMp4;
}

async function concatVideos(files, outputPath) {
  const listFile = path.join(OUTPUT_DIR, "scene-07-roles-concat.txt");
  fs.writeFileSync(listFile, files.map((f) => `file '${f}'`).join("\n"));
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outputPath,
  ], { stdio: "inherit" });
  if (result.status !== 0) {
    spawnSync("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", listFile,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart",
      outputPath,
    ], { stdio: "inherit" });
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chromePath = findChrome();
  const server = await serveStatic(__dirname);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const totalFrames = Math.ceil(FPS * DURATION);
  const frameMs = 1000 / FPS;

  const roles = ONLY_ROLE
    ? ROLES.filter((r) => r.key === ONLY_ROLE)
    : ROLES;

  if (!roles.length) {
    throw new Error(`Unknown role "${ONLY_ROLE}". Use: operator, engineer, supervisor, manager`);
  }

  console.log(`Scene 7 per-role: ${DURATION}s × ${roles.length} role(s) @ ${FPS}fps`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const outputs = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    for (const role of roles) {
      outputs.push(await renderRole(page, baseUrl, role, totalFrames, frameMs));
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (!ONLY_ROLE && outputs.length === ROLES.length) {
    const fullPath = path.join(OUTPUT_DIR, "scene-07-roles-full.mp4");
    console.log("Concatenating full scene...");
    await concatVideos(outputs, fullPath);
    console.log(`Done: ${fullPath}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
