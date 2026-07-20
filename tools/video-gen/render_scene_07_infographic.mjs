#!/usr/bin/env node
/**
 * Render scene-07-role-infographic.html to MP4 (2×2 communicative layout).
 *
 * Usage:
 *   node render_scene_07_infographic.mjs
 *   node render_scene_07_infographic.mjs --duration 20 --fps 30
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
const DURATION = Number(getArg("--duration", "20"));
const WIDTH = 1920;
const HEIGHT = 1080;
const HTML_FILE = "scene-07-role-infographic.html";
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-07-infographic");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-07-role-infographic.mp4");

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
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const htmlPath = path.join(__dirname, HTML_FILE);
  if (!fs.existsSync(htmlPath)) throw new Error(`Missing ${htmlPath}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  for (const file of fs.readdirSync(FRAMES_DIR)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  const chromePath = findChrome();
  const server = await serveStatic(__dirname);
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/${HTML_FILE}`;
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
    console.log(`Loading ${pageUrl} (waiting for photos)...`);
    await page.goto(pageUrl, { waitUntil: "networkidle0", timeout: 120000 });
    await sleep(1500);

    console.log(`Rendering ${DURATION}s @ ${FPS}fps`);
    for (let i = 0; i < totalFrames; i += 1) {
      const framePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(5, "0")}.png`);
      await page.screenshot({ path: framePath, type: "png" });
      if (i < totalFrames - 1) await sleep(frameMs);
    }

    console.log(`Captured ${totalFrames} frames, encoding...`);
    encodeVideo({ framesDir: FRAMES_DIR, outputMp4: OUTPUT_MP4, fps: FPS, totalFrames });
    const stats = fs.statSync(OUTPUT_MP4);
    console.log(`Done: ${OUTPUT_MP4} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
