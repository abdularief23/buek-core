#!/usr/bin/env node
/** Capture README screenshots from live demo. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { findChrome, setupPage, launchDemo, sleep } from "./lib/video-capture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "..", "docs", "images", "screenshots");
const SITE = "https://core.buekwebsite.com";

async function clickNav(page, label) {
  await page.evaluate((needle) => {
    const btn = [...document.querySelectorAll("button, a")].find((el) =>
      el.textContent?.trim().includes(needle),
    );
    btn?.click();
  }, label);
  await sleep(1200);
}

async function openInvestigation(page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("article button, button")].find((el) =>
      /open investigation|buka investigasi|mulai/i.test(el.textContent ?? ""),
    );
    btn?.scrollIntoView({ block: "center" });
    btn?.click();
  });
  await page.waitForFunction(
    () => document.body?.innerText?.match(/STEP 1|Evidence|Engineering Analysis/i),
    { timeout: 45000 },
  );
  await sleep(1500);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await setupPage(page);

    // Engineer dashboard
    await launchDemo(page, SITE, { company: "Epson Indonesia", role: "Engineer" });
    await page.waitForFunction(() => document.body?.innerText?.length > 200, { timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, "engineer-dashboard.png"), type: "png" });
    console.log("engineer-dashboard.png");

    // Investigation wizard
    await openInvestigation(page);
    await page.screenshot({ path: path.join(OUT, "investigation-wizard.png"), type: "png" });
    console.log("investigation-wizard.png");

    // Company Brain
    await clickNav(page, "Knowledge");
    await page.waitForFunction(
      () => document.body?.innerText?.includes("Company Brain"),
      { timeout: 20000 },
    );
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, "company-brain.png"), type: "png" });
    console.log("company-brain.png");

    await page.close();

    // Plant Manager dashboard
    const page2 = await browser.newPage();
    await setupPage(page2);
    await launchDemo(page2, SITE, { company: "Epson Indonesia", role: "Plant Manager" });
    await page2.waitForFunction(() => document.body?.innerText?.length > 200, { timeout: 30000 });
    await sleep(1500);
    await page2.screenshot({ path: path.join(OUT, "executive-dashboard.png"), type: "png" });
    console.log("executive-dashboard.png");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
