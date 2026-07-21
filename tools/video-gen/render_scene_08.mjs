#!/usr/bin/env node
/**
 * Scene 8: Investigation starts — White Streak → Evidence upload → Step 2.
 *
 * Usage:
 *   node render_scene_08.mjs
 *   node render_scene_08.mjs --duration 20 --fps 30
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
const DURATION = Number(getArg("--duration", "20"));
const WIDTH = 1920;
const HEIGHT = 1080;
const SAMPLE_PHOTO = path.join(__dirname, "input", "sample-defect.jpg");
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-08");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-08-investigation.mp4");

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

async function launchEpsonEngineer(page) {
  await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForFunction(
    () => document.body?.innerText?.includes("Buek Core"),
    { timeout: 30000 },
  );

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(600);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button.login-card")].find(
      (el) => el.textContent?.includes("Epson Indonesia"),
    );
    btn?.click();
  });

  await page.click('input[value="Engineer"]');
  await page.click(".login-launch-btn");
  await page.waitForSelector(".app-shell", { timeout: 45000 });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/White Streak|Today's Investigation|Masalah Hari Ini/i),
    { timeout: 30000 },
  );
}

async function captureFrames(chromePath) {
  if (!fs.existsSync(SAMPLE_PHOTO)) {
    throw new Error(`Missing sample photo: ${SAMPLE_PHOTO}`);
  }

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

    console.log(`Launching Epson Engineer demo...`);
    await launchEpsonEngineer(page);
    await hold(2200);

    console.log("Opening White Streak investigation...");
    const opened = await page.evaluate(() => {
      const card = [...document.querySelectorAll("article")].find(
        (el) => el.textContent?.includes("White Streak"),
      );
      const btn = card?.querySelector("button");
      if (!btn) return false;
      btn.scrollIntoView({ block: "center", behavior: "instant" });
      btn.click();
      return true;
    });
    if (!opened) throw new Error("White Streak investigation button not found");

    await page.waitForFunction(
      () => document.body?.innerText?.match(/STEP 1|Evidence|Engineering Analysis/i),
      { timeout: 45000 },
    );
    await hold(1800);

    console.log("Adding evidence...");
    await page.evaluate(() => {
      const toggle = (label) => {
        const row = [...document.querySelectorAll("label")].find((el) =>
          el.textContent?.trim().startsWith(label),
        );
        const input = row?.querySelector('input[type="checkbox"]');
        if (input && !input.checked) input.click();
      };
      toggle("QC Result");
      toggle("Machine History");
      toggle("Trend");
    });
    await hold(800);

    const fileInput = await page.$('input[type="file"][accept*="image"]');
    if (!fileInput) throw new Error("Photo upload input not found");
    await fileInput.uploadFile(SAMPLE_PHOTO);
    await hold(1200);

    await page.evaluate(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.focus();
        textarea.value = "QC report attached — white streak defect confirmed on Line 2 sample batch.";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await hold(1500);

    console.log("Moving to Step 2 — Possible Root Cause...");
    await page.evaluate(() => {
      const stepBtn = [...document.querySelectorAll(".investigation-stepper button")].find(
        (el) => el.textContent?.includes("Possible Root Cause"),
      );
      stepBtn?.click();
    });
    await page.waitForFunction(
      () => document.body?.innerText?.includes("STEP 2"),
      { timeout: 15000 },
    );
    await hold(3500);

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

  console.log(`Scene 8: ${DURATION}s @ ${FPS}fps — ${SITE_URL}`);
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
