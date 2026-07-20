#!/usr/bin/env node
/**
 * Scene 7: Login flow — demo credentials → Toyota → Engineer → Launch Demo.
 *
 * Usage:
 *   node render_scene_07.mjs
 *   node render_scene_07.mjs --duration 25 --fps 30
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
const DURATION = Number(getArg("--duration", "25"));
const WIDTH = 1920;
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-07");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-07-login.mp4");

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

async function captureFrames(chromePath) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  for (const file of fs.readdirSync(FRAMES_DIR)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  const frameMs = 1000 / FPS;
  let frameIndex = 0;

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

    async function shot() {
      const framePath = path.join(FRAMES_DIR, `frame-${String(frameIndex).padStart(4, "0")}.png`);
      await page.screenshot({ path: framePath, type: "png" });
      frameIndex += 1;
    }

    async function hold(ms) {
      const steps = Math.max(1, Math.round(ms / frameMs));
      for (let i = 0; i < steps; i += 1) {
        await shot();
        if (i < steps - 1) await sleep(frameMs);
      }
    }

    async function smoothScrollTo(selector, ms) {
      const { startY, targetY } = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        const start = window.scrollY;
        if (!el) return { startY: start, targetY: start };
        const target = el.getBoundingClientRect().top + window.scrollY - 80;
        return { startY: start, targetY: Math.max(0, target) };
      }, selector);

      const steps = Math.max(1, Math.round(ms / frameMs));
      for (let i = 0; i <= steps; i += 1) {
        const t = easeInOutCubic(i / steps);
        const y = startY + (targetY - startY) * t;
        await page.evaluate((yy) => window.scrollTo({ top: yy, left: 0, behavior: "instant" }), y);
        await shot();
        if (i < steps) await sleep(frameMs);
      }
    }

    async function clickTextButton(text, selector = "button") {
      const clicked = await page.evaluate((needle, sel) => {
        const btn = [...document.querySelectorAll(sel)].find(
          (el) => el.textContent?.includes(needle),
        );
        if (!btn) return false;
        btn.scrollIntoView({ block: "center", behavior: "instant" });
        btn.click();
        return true;
      }, text, selector);

      if (!clicked) throw new Error(`Button not found: ${text}`);
    }

    console.log(`Loading ${SITE_URL}...`);
    await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForFunction(
      () => document.body?.innerText?.includes("Buek Core"),
      { timeout: 30000 },
    );

    // 1. Show login + demo credentials
    await page.evaluate(() => window.scrollTo(0, 0));
    await hold(2800);

    // 2. Scroll to Demo Industry section
    await smoothScrollTo(".login-demo-hint", 2200);
    await hold(800);
    await smoothScrollTo("button.login-card", 1800);
    await hold(1200);

    // 3. Select Toyota Indonesia
    console.log("Selecting Toyota Indonesia...");
    await clickTextButton("Toyota Indonesia", "button.login-card");
    await hold(1200);

    // 4. Select Engineer role
    console.log("Selecting Engineer role...");
    await page.click('input[value="Engineer"]');
    await hold(1200);

    // 5. Launch Demo
    console.log("Launching demo...");
    await page.click(".login-launch-btn");
    await page.waitForSelector(".app-shell", { timeout: 45000 });
    await page.waitForFunction(
      () => document.body?.innerText?.match(/Investigation|Masalah Hari Ini|Today's/i),
      { timeout: 30000 },
    );
    await hold(3500);

    // Pad to target duration
    const targetFrames = Math.ceil(FPS * DURATION);
    while (frameIndex < targetFrames) {
      await hold(frameMs);
    }

    return Math.min(frameIndex, targetFrames);
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
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chromePath = findChrome();

  console.log(`Scene 7: ${DURATION}s @ ${FPS}fps — ${SITE_URL}`);
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
