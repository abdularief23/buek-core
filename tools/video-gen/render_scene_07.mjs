#!/usr/bin/env node
/**
 * Scene 7 (revised): Role-Based Workspace — 5 shots × 4s = 20s
 *
 * Shot 1: Login → Toyota → Engineer → Launch Demo
 * Shot 2: Operator workspace (production + report problem)
 * Shot 3: Engineer workspace (open investigation)
 * Shot 4: Supervisor workspace (review + approve)
 * Shot 5: Plant Manager executive dashboard
 *
 * Also exports individual shot MP4s for CapCut + Veo B-roll compositing.
 *
 * Usage:
 *   node render_scene_07.mjs
 *   node render_scene_07.mjs --shot 3        # render single shot only
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import {
  findChrome,
  setupPage,
  launchDemo,
  clickTextButton,
  clickAt,
  smoothScrollTo,
  createRecorder,
  encodeVideo,
  sleep,
} from "./lib/video-capture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const SITE_URL = getArg("--url", "https://core.buekwebsite.com");
const FPS = Number(getArg("--fps", "30"));
const SHOT_SECONDS = Number(getArg("--shot-duration", "4"));
const ONLY_SHOT = args.includes("--shot") ? Number(getArg("--shot", "0")) : 0;
const OUTPUT_DIR = path.join(__dirname, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "frames-scene-07");
const OUTPUT_MP4 = path.join(OUTPUT_DIR, "scene-07-role-workspaces.mp4");

const SHOTS = [
  { id: "shot1-login", name: "Login → Launch Demo" },
  { id: "shot2-operator", name: "Operator Workspace" },
  { id: "shot3-engineer", name: "Engineer Investigation" },
  { id: "shot4-supervisor", name: "Supervisor Review" },
  { id: "shot5-manager", name: "Plant Manager Dashboard" },
];

async function shot1Login(page, rec) {
  await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForFunction(() => document.body?.innerText?.includes("Buek Core"));
  await page.evaluate(() => window.scrollTo(0, 0));
  await rec.hold(page, 900);

  await smoothScrollTo(page, ".login-demo-hint", 1200, rec.frameMs, () => rec.shot(page));
  await rec.hold(page, 500);

  await clickTextButton(page, "Toyota Indonesia", "button.login-card");
  await rec.hold(page, 700);

  const engineerRadio = await page.$('input[value="Engineer"]');
  if (!engineerRadio) throw new Error("Engineer role radio not found");
  await engineerRadio.click();
  await rec.hold(page, 600);

  await page.click(".login-launch-btn");
  await page.waitForSelector(".app-shell", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/Good Morning|Masalah Hari Ini|Today's/i),
    { timeout: 30000 },
  );
  await rec.hold(page, 1200);
}

async function shot2Operator(page, rec) {
  await launchDemo(page, SITE_URL, { role: "Operator" });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/Good Morning|Today's Work|Laporkan/i),
    { timeout: 30000 },
  );
  await rec.hold(page, 1000);

  await smoothScrollTo(page, "h2", 1000, rec.frameMs, () => rec.shot(page));
  await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent?.includes("Today's Work"),
    );
    heading?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await rec.hold(page, 1200);

  await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent?.includes("Laporkan"),
    );
    heading?.scrollIntoView({ block: "start", behavior: "instant" });
  });
  await rec.hold(page, 1000);

  const submitBox = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Submit Laporan"),
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (submitBox) await moveCursorOnly(page, submitBox.x, submitBox.y);
  await rec.hold(page, 800);
}

async function shot3Engineer(page, rec) {
  await launchDemo(page, SITE_URL, { role: "Engineer" });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/Masalah Hari Ini|Today's Investigation|Investigation/i),
    { timeout: 30000 },
  );
  await rec.hold(page, 1200);

  const opened = await page.evaluate(() => {
    const card = [...document.querySelectorAll("article")].find((el) =>
      el.querySelector("button"),
    );
    const btn = card?.querySelector("button");
    if (!btn) return false;
    btn.scrollIntoView({ block: "center", behavior: "instant" });
    btn.click();
    return true;
  });
  if (!opened) throw new Error("Engineer investigation button not found");

  await page.waitForFunction(
    () => document.body?.innerText?.match(/STEP 1|Evidence|Engineering Analysis/i),
    { timeout: 45000 },
  );
  await rec.hold(page, 1500);

  await page.evaluate(() => {
    const step2 = [...document.querySelectorAll(".investigation-stepper button")].find((el) =>
      el.textContent?.includes("Possible Root Cause"),
    );
    step2?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await rec.hold(page, 1300);
}

async function shot4Supervisor(page, rec) {
  await launchDemo(page, SITE_URL, { role: "Supervisor" });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/Menunggu Review|Ringkasan Hari Ini|Review Sekarang/i),
    { timeout: 30000 },
  );
  await rec.hold(page, 1000);

  const hasReview = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Review Sekarang"),
    );
    if (btn) {
      btn.scrollIntoView({ block: "center", behavior: "instant" });
      btn.click();
      return true;
    }
    const pending = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Analisa Menunggu"),
    );
    pending?.scrollIntoView({ block: "center", behavior: "instant" });
    return false;
  });

  if (hasReview) {
    await page.waitForFunction(
      () => document.body?.innerText?.match(/Supervisor Review|Approve|Root Cause/i),
      { timeout: 30000 },
    );
    await rec.hold(page, 1200);

    const approveBox = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.trim() === "Approve",
      );
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (approveBox) await moveCursorOnly(page, approveBox.x, approveBox.y);
    await rec.hold(page, 1800);
  } else {
    await smoothScrollTo(page, "h2", 800, rec.frameMs, () => rec.shot(page));
    await rec.hold(page, 2200);
  }
}

async function shot5Manager(page, rec) {
  await launchDemo(page, SITE_URL, { role: "Plant Manager" });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/Ringkasan Pabrik|Today's Focus|Factory/i),
    { timeout: 30000 },
  );
  await rec.hold(page, 1200);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await rec.hold(page, 800);

  await page.evaluate(() => {
    const kpi = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent?.includes("Ringkasan Pabrik"),
    );
    kpi?.scrollIntoView({ block: "start", behavior: "instant" });
  });
  await rec.hold(page, 1500);

  await page.evaluate(() => {
    const issues = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent?.includes("Isu Kritis"),
    );
    issues?.scrollIntoView({ block: "start", behavior: "instant" });
  });
  await rec.hold(page, 1300);
}

async function moveCursorOnly(page, x, y) {
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
  await sleep(300);
}

const SHOT_RUNNERS = [shot1Login, shot2Operator, shot3Engineer, shot4Supervisor, shot5Manager];

async function renderShot(browser, shotIndex) {
  const shot = SHOTS[shotIndex];
  const shotFramesDir = path.join(OUTPUT_DIR, `frames-scene-07-${shot.id}`);
  const shotMp4 = path.join(OUTPUT_DIR, `scene-07-${shot.id}.mp4`);
  const targetFrames = SHOT_SECONDS * FPS;
  const rec = createRecorder({ framesDir: shotFramesDir, fps: FPS });

  const page = await browser.newPage();
  await setupPage(page);

  console.log(`  Shot ${shotIndex + 1}: ${shot.name}`);
  await SHOT_RUNNERS[shotIndex](page, rec);

  while (rec.count < targetFrames) {
    await rec.hold(page, rec.frameMs);
  }

  await page.close();
  encodeVideo({ framesDir: shotFramesDir, outputMp4: shotMp4, fps: FPS, totalFrames: targetFrames });
  console.log(`    → ${shotMp4}`);
  return shotMp4;
}

async function concatShots(shotFiles) {
  const listFile = path.join(OUTPUT_DIR, "scene-07-concat.txt");
  fs.writeFileSync(
    listFile,
    shotFiles.map((f) => `file '${f}'`).join("\n"),
  );

  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-c", "copy",
    OUTPUT_MP4,
  ], { stdio: "inherit" });

  if (result.status !== 0) {
    console.warn("Concat copy failed, re-encoding...");
    spawnSync("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "18",
      "-movflags", "+faststart",
      OUTPUT_MP4,
    ], { stdio: "inherit" });
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chromePath = findChrome();

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-timer-throttling",
    ],
  });

  try {
    const shotIndexes = ONLY_SHOT
      ? [ONLY_SHOT - 1]
      : SHOTS.map((_, i) => i);

    console.log(`Scene 7 Role Workspaces: ${SHOT_SECONDS}s × ${shotIndexes.length} shot(s) @ ${FPS}fps`);
    const shotFiles = [];
    for (const idx of shotIndexes) {
      shotFiles.push(await renderShot(browser, idx));
    }

    if (!ONLY_SHOT && shotFiles.length === SHOTS.length) {
      console.log("Concatenating full scene...");
      await concatShots(shotFiles);
      const stats = fs.statSync(OUTPUT_MP4);
      console.log(`Done: ${OUTPUT_MP4} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
