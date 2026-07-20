# Buek Core — Voiceover Script (Build Week Submission)

**Target length:** ~3:00 · **Pace:** ~130 words/min · **Language:** English

Judges must hear **Codex** (how we built it) and **GPT-5.6** (how it runs) — not just "we used AI."

---

## Full script (read-through)

| # | Time | Visual | Voiceover |
|---|------|--------|-----------|
| 1 | 0:00–0:06 | Opening factory | Every day, manufacturing teams face production issues that need fast, clear decisions. |
| 2 | 0:06–0:12 | Engineer at desk | Engineers lose hours digging through SOPs, old reports, and scattered company knowledge. |
| 3 | 0:12–0:20 | Line stopped | Meanwhile, the line is down. Every minute costs money. What if AI could work like another engineer on your team? |
| 4 | 0:20–0:22 | Logo reveal | *(silent — logo only)* |
| 5 | 0:22–0:35 | Website hero | This is **Buek Core**. We built it during OpenAI Build Week — using **Codex** to ship the full platform, from UI to API to deployment. |
| 6 | 0:35–0:45 | Platform vision | And **GPT-5.6** powers the reasoning inside — one AI engine, your domain knowledge, starting with manufacturing. |
| 7 | 0:45–1:05 | Role workspaces | Every role gets its own workspace. Operators keep the line running. Engineers investigate root causes. Supervisors approve corrective actions. Plant managers track KPIs in real time. |
| 8 | 1:05–1:25 | Investigation wizard | When a defect is reported — like this white streak on print — the engineer opens a guided five-step investigation. |
| 9 | 1:25–1:45 | AI analysis | **GPT-5.6** analyzes the evidence, retrieves relevant SOPs, and ranks possible causes. The engineer always makes the final call. |
| 10 | 1:45–2:00 | Countermeasure | It recommends countermeasures and helps draft an execution plan — ready for supervisor review. |
| 11 | 2:00–2:25 | Company Brain | Every completed investigation becomes part of the Company Brain. The next case starts smarter. |
| 12 | 2:25–2:45 | AI Copilot | In the AI Copilot, **GPT-5.6** answers in plain language — search similar defects, summarize open issues, draft investigation reports. |
| 13 | 2:45–3:00 | Future industries | Manufacturing is our first domain. The same AI Core plugs into healthcare, construction, and more — without rebuilding from scratch. |
| 14 | 3:00–3:10 | Closing | **Buek Core** — built with **Codex**, powered by **GPT-5.6**. Build AI workers for any industry. core.buekwebsite.com |

---

## Plain text (copy-paste for CapCut / ElevenLabs)

```
Every day, manufacturing teams face production issues that need fast, clear decisions.

Engineers lose hours digging through SOPs, old reports, and scattered company knowledge.

Meanwhile, the line is down. Every minute costs money. What if AI could work like another engineer on your team?

This is Buek Core. We built it during OpenAI Build Week — using Codex to ship the full platform, from UI to API to deployment.

And GPT-5.6 powers the reasoning inside — one AI engine, your domain knowledge, starting with manufacturing.

Every role gets its own workspace. Operators keep the line running. Engineers investigate root causes. Supervisors approve corrective actions. Plant managers track KPIs in real time.

When a defect is reported — like this white streak on print — the engineer opens a guided five-step investigation.

GPT-5.6 analyzes the evidence, retrieves relevant SOPs, and ranks possible causes. The engineer always makes the final call.

It recommends countermeasures and helps draft an execution plan — ready for supervisor review.

Every completed investigation becomes part of the Company Brain. The next case starts smarter.

In the AI Copilot, GPT-5.6 answers in plain language — search similar defects, summarize open issues, draft investigation reports.

Manufacturing is our first domain. The same AI Core plugs into healthcare, construction, and more — without rebuilding from scratch.

Buek Core — built with Codex, powered by GPT-5.6. Build AI workers for any industry. core.buekwebsite.com
```

---

## CapCut assembly notes

1. Import scene videos from `tools/video-gen/output/` in order (see video-production-guide.md).
2. Lay voice track on top — align Scene 5 mention of **Codex** with website hero; Scene 9 & 12 with copilot/analysis screen recordings.
3. Music bed at **-18 dB** under voice.
4. Enable subtitles; fix brand names: **Buek Core**, **Codex**, **GPT-5.6**, **SOP**.
5. Speed up screen recordings 1.1–1.2× if total runtime exceeds 3:10.

---

## Audio files

Generated TTS (edge-tts, per scene):

```bash
cd tools/video-gen
python3 generate_voiceover.py
```

Output: `tools/video-gen/voiceover/scene-01.mp3` … `scene-14.mp3` + `voiceover-full.mp3`

Voice: `en-US-GuyNeural` (change in script if you prefer another).

---

## Versi Indonesia (opsional)

Kalau mau voiceover Bahasa Indonesia, ganti teks di `tools/video-gen/voiceover-lines.json` dan set voice ke `id-ID-ArdiNeural`.
