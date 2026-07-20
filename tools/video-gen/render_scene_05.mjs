#!/usr/bin/env node
/**
 * Scene 5: Screen-record Buek Core website (hero + slow scroll).
 *
 * Usage:
 *   node render_scene_05.mjs
 *   node render_scene_05.mjs --duration 13 --fps 30 --url https://core.buekwebsite.com
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const SITE_URL = getArg("--url", "https://core.buekwebsite.com");
const FPS = Number(getArg("--fps", "30"));
const DURATION = Number(getArg("--duration", "13"));
const WIDTH = 1920;
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-05");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-05-website.mp4");

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

/** Scroll timeline: hold hero → slow scroll → hold demo section */
function scrollProgress(frameIndex, totalFrames) {
  const t = frameIndex / Math.max(totalFrames - 1, 1);
  const holdStart = 0.18;
  const scrollEnd = 0.78;
  if (t <= holdStart) return 0;
  if (t >= scrollEnd) return 1;
  const scrollT = (t - holdStart) / (scrollEnd - holdStart);
  return easeInOutCubic(scrollT);
}

async function captureFrames(chromePath) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  for (const file of fs.readdirSync(FRAMES_DIR)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  const totalFrames = Math.ceil(FPS * DURATION);
  const frameMs = 1000 / FPS;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("buek-language", "en");
      const style = document.createElement("style");
      style.textContent = "::-webkit-scrollbar { display: none; } html { scrollbar-width: none; }";
      document.documentElement.appendChild(style);
    });

    console.log(`Loading ${SITE_URL}...`);
    await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForFunction(
      () => document.body?.innerText?.includes("Buek Core"),
      { timeout: 30000 },
    );
    await sleep(1200);

    const maxScroll = await page.evaluate(() => (
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    ));

    console.log(`Recording ${totalFrames} frames (max scroll: ${maxScroll}px)...`);

    for (let i = 0; i < totalFrames; i += 1) {
      const progress = scrollProgress(i, totalFrames);
      const scrollY = Math.round(maxScroll * progress);
      await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: "instant" }), scrollY);

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

  if (result.status !== 0) {
    throw new Error("ffmpeg failed");
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chromePath = findChrome();

  console.log(`Scene 5: ${DURATION}s @ ${FPS}fps — ${SITE_URL}`);
  const totalFrames = await captureFrames(chromePath);
  console.log(`Captured ${totalFrames} frames, encoding...`);
  encodeVideo(totalFrames);

  const stats = fs.statSync(OUTPUT_MP4);
  console.log(`Done: ${OUTPUT_MP4} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
