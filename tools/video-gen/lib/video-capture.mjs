#!/usr/bin/env node
/**
 * Shared Puppeteer helpers for Buek Core video renders.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Chrome/Chromium not found. Set CHROME_PATH.");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export async function setupPage(page) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("buek-language", "en");
    const style = document.createElement("style");
    style.textContent = `
      ::-webkit-scrollbar { display: none; }
      html { scrollbar-width: none; }
      #buek-rec-cursor {
        position: fixed; z-index: 99999; width: 18px; height: 18px;
        border-radius: 50%; background: rgba(255,255,255,0.95);
        border: 2px solid rgba(13,79,240,0.9);
        box-shadow: 0 0 0 4px rgba(13,79,240,0.2);
        pointer-events: none; transform: translate(-50%, -50%);
        transition: left 0.35s ease, top 0.35s ease;
      }
    `;
    document.documentElement.appendChild(style);
  });
}

export async function moveCursor(page, x, y) {
  await page.evaluate((px, py) => {
    let cursor = document.getElementById("buek-rec-cursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = "buek-rec-cursor";
      document.body.appendChild(cursor);
    }
    cursor.style.left = `${px}px`;
    cursor.style.top = `${py}px`;
  }, x, y);
  await sleep(280);
}

export async function clickAt(page, x, y) {
  await moveCursor(page, x, y);
  await page.mouse.click(x, y);
  await sleep(200);
}

export async function clickTextButton(page, text, selector = "button") {
  const box = await page.evaluate((needle, sel) => {
    const el = [...document.querySelectorAll(sel)].find((node) =>
      node.textContent?.includes(needle),
    );
    if (!el) return null;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, text, selector);

  if (!box) throw new Error(`Button not found: ${text}`);
  await clickAt(page, box.x, box.y);
}

export async function smoothScrollTo(page, selector, ms, frameMs, onFrame) {
  const { startY, targetY } = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const start = window.scrollY;
    if (!el) return { startY: start, targetY: start };
    const target = el.getBoundingClientRect().top + window.scrollY - 100;
    return { startY: start, targetY: Math.max(0, target) };
  }, selector);

  const steps = Math.max(1, Math.round(ms / frameMs));
  for (let i = 0; i <= steps; i += 1) {
    const t = easeInOutCubic(i / steps);
    const y = startY + (targetY - startY) * t;
    await page.evaluate((yy) => window.scrollTo({ top: yy, left: 0, behavior: "instant" }), y);
    await onFrame();
    if (i < steps) await sleep(frameMs);
  }
}

export async function launchDemo(page, siteUrl, { company = "Toyota Indonesia", role }) {
  await page.goto(siteUrl, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForFunction(
    () => document.body?.innerText?.includes("Buek Core"),
    { timeout: 30000 },
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await clickTextButton(page, company, "button.login-card");
  await sleep(400);
  await page.click(`input[value="${role}"]`);
  await sleep(400);
  await page.click(".login-launch-btn");
  await page.waitForSelector(".app-shell", { timeout: 45000 });
  await sleep(800);
}

export function createRecorder({ framesDir, fps }) {
  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    if (file.endsWith(".png")) fs.unlinkSync(path.join(framesDir, file));
  }

  const frameMs = 1000 / fps;
  let frameIndex = 0;

  async function shot(page) {
    const framePath = path.join(framesDir, `frame-${String(frameIndex).padStart(5, "0")}.png`);
    await page.screenshot({ path: framePath, type: "png" });
    frameIndex += 1;
  }

  async function hold(page, ms) {
    const steps = Math.max(1, Math.round(ms / frameMs));
    for (let i = 0; i < steps; i += 1) {
      await shot(page);
      if (i < steps - 1) await sleep(frameMs);
    }
  }

  return { shot, hold, frameMs, get count() { return frameIndex; } };
}

export function encodeVideo({ framesDir, outputMp4, fps, totalFrames }) {
  const result = spawnSync("ffmpeg", [
    "-y",
    "-framerate", String(fps),
    "-i", path.join(framesDir, "frame-%05d.png"),
    "-frames:v", String(totalFrames),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-movflags", "+faststart",
    outputMp4,
  ], { stdio: "inherit" });

  if (result.status !== 0) throw new Error(`ffmpeg failed for ${outputMp4}`);
}
