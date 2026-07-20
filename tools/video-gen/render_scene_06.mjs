#!/usr/bin/env node
/**
 * Render scene-06-platform-vision.html to MP4.
 *
 * Usage:
 *   node render_scene_06.mjs
 *   node render_scene_06.mjs --duration 10 --fps 30
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const FPS = Number(getArg("--fps", "30"));
const DURATION = Number(getArg("--duration", "10"));
const WIDTH = 1920;
const HEIGHT = 1080;
const HTML_FILE = "scene-06-platform-vision.html";
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-06");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-06-platform-vision.mp4");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Chrome/Chromium not found. Set CHROME_PATH.");
}

function serveStatic(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const safePath = path.normalize(req.url.split("?")[0]).replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(rootDir, safePath === "/" ? HTML_FILE : safePath.slice(1));
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath);
      const type = ext === ".html" ? "text/html" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureFrames(pageUrl, chromePath) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  for (const file of fs.readdirSync(FRAMES_DIR)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  const totalFrames = Math.ceil(FPS * DURATION);
  const frameMs = 1000 / FPS;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.goto(pageUrl, { waitUntil: "networkidle0" });

    for (let i = 0; i < totalFrames; i += 1) {
      const framePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: framePath, type: "png" });
      if (i < totalFrames - 1) await sleep(frameMs);
    }

    return totalFrames;
  } finally {
    await browser.close();
  }
}

function encodeVideo(totalFrames) {
  const result = spawnSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(FRAMES_DIR, "frame-%04d.png"),
    "-frames:v", String(totalFrames),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-movflags", "+faststart",
    OUTPUT_MP4,
  ], { stdio: "inherit" });

  if (result.status !== 0) throw new Error("ffmpeg failed");
}

async function main() {
  const htmlPath = path.join(__dirname, HTML_FILE);
  if (!fs.existsSync(htmlPath)) throw new Error(`Missing ${htmlPath}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chromePath = findChrome();
  const server = await serveStatic(__dirname);
  const { port } = server.address();

  console.log(`Scene 6: ${DURATION}s @ ${FPS}fps`);
  try {
    const totalFrames = await captureFrames(`http://127.0.0.1:${port}/${HTML_FILE}`, chromePath);
    console.log(`Captured ${totalFrames} frames, encoding...`);
    encodeVideo(totalFrames);
    const stats = fs.statSync(OUTPUT_MP4);
    console.log(`Done: ${OUTPUT_MP4} (${(stats.size / 1024).toFixed(1)} KB)`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
