import type { KnowledgeSource } from "@buek/shared-types";

export const manufacturingKnowledge: KnowledgeSource[] = [
  {
    id: "manufacturing-production-flow",
    title: "Manufacturing production flow",
    type: "runbook",
    referenceId: "SOP-001",
    summary:
      "High-level production flow covering planning, raw material readiness, shop floor execution, quality checks, and shipment handoff.",
    tags: ["production", "operations", "shop-floor"],
    content:
      "Use a structured flow: confirm product and lot, inspect input material readiness, verify machine setup, run first article inspection, monitor in-process quality, record defects, apply containment, then hand off to shipment only after final QC release."
  },
  {
    id: "manufacturing-quality-basics",
    title: "Quality control basics",
    type: "document",
    referenceId: "QC Standard 01",
    summary:
      "General quality control concepts for inspection points, defect reporting, corrective actions, and traceability.",
    tags: ["quality", "inspection", "traceability"],
    content:
      "Every defect response should include defect description, suspected process step, containment action, root cause hypothesis, countermeasure, verification method, and reference evidence. Do not release affected lots until containment is complete."
  },
  {
    id: "printer-white-streaks-sop",
    title: "Printer white streak troubleshooting",
    type: "runbook",
    referenceId: "SOP-014",
    summary:
      "Troubleshooting SOP for white streaks, missing lines, or pale vertical bands in printed output.",
    tags: ["printer", "white-streaks", "defect", "print-quality", "troubleshooting"],
    content:
      "For white streaks: 1) isolate affected printer, lot, shift, media type, and cartridge or printhead ID; 2) print a nozzle check or test pattern; 3) inspect for clogged nozzles, low ink/toner, contaminated media path, worn transfer roller, blocked printhead, or incorrect print density; 4) clean printhead/nozzle and media path; 5) replace consumable if test pattern still shows missing bands; 6) run three consecutive OK samples before releasing production."
  },
  {
    id: "printer-qc-standard-12",
    title: "Printer visual quality standard",
    type: "policy",
    referenceId: "QC Standard 12",
    summary:
      "Acceptance criteria for visible streaks, density variation, banding, smudges, and repeat defects.",
    tags: ["printer", "qc", "acceptance", "white-streaks", "visual-inspection"],
    content:
      "Reject printed output when white streaks exceed 0.5 mm width, repeat across more than 20 mm length, obscure text/barcode readability, or appear on more than two consecutive samples. Accept only after defect is absent in three consecutive samples under standard lighting."
  },
  {
    id: "why-why-white-streaks",
    title: "Why-Why analysis for white streaks",
    type: "document",
    referenceId: "WHY-007",
    summary:
      "Example Why-Why path for printer white streak defects caused by blocked nozzles or transfer issues.",
    tags: ["why-why", "root-cause", "printer", "white-streaks"],
    content:
      "Why are white streaks visible? Ink or toner is not transferred consistently. Why is transfer inconsistent? A nozzle, printhead channel, toner path, or transfer roller is partially blocked or worn. Why was the blockage not detected? Preventive cleaning or first article test was skipped or not recorded. Why was it skipped? Setup checklist did not force evidence capture before production start. Countermeasure: require test pattern evidence at setup and after consumable change."
  },
  {
    id: "countermeasure-printhead-cleaning",
    title: "Countermeasure: printhead and nozzle cleaning",
    type: "runbook",
    referenceId: "CM-021",
    summary:
      "Standard countermeasure for clogged printheads, missing lines, and uneven print output.",
    tags: ["countermeasure", "printhead", "cleaning", "printer"],
    content:
      "Run the approved cleaning cycle, wipe external contact surfaces with lint-free material, confirm ink flow, print a test pattern, and compare against the master sample. Escalate to printhead replacement if two cleaning cycles do not restore the missing lines."
  },
  {
    id: "countermeasure-transfer-roller",
    title: "Countermeasure: transfer roller inspection",
    type: "runbook",
    referenceId: "CM-024",
    summary: "Countermeasure for laser printer streaks caused by roller wear or contamination.",
    tags: ["countermeasure", "transfer-roller", "laser-printer", "streaks"],
    content:
      "Inspect transfer roller for toner buildup, scratches, flat spots, and uneven pressure. Clean if contamination is light. Replace roller when streak spacing repeats at a fixed interval or surface damage is visible."
  },
  {
    id: "defect-containment-printer-output",
    title: "Containment for printer output defects",
    type: "policy",
    referenceId: "SOP-019",
    summary: "Containment steps when print quality defect is found during production.",
    tags: ["containment", "printer", "defect", "quality"],
    content:
      "Stop shipment for affected lot, label suspect output, segregate last-known-good to current output, inspect back to the previous approved QC checkpoint, record defect images, and release only after rework or replacement output passes QC Standard 12."
  },
  {
    id: "kaizen-printer-first-article",
    title: "Kaizen: first article print evidence",
    type: "document",
    referenceId: "KAIZEN-004",
    summary: "Small process improvement to prevent recurring print defects at production start.",
    tags: ["kaizen", "first-article", "printer", "prevention"],
    content:
      "Add a mandatory first article print photo and nozzle or test-pattern upload to the setup checklist. The operator cannot start the production run until the supervisor approves the sample against QC Standard 12."
  },
  {
    id: "printer-root-cause-matrix",
    title: "Printer defect root cause matrix",
    type: "schema",
    referenceId: "RCM-003",
    summary: "Root cause mapping for white streaks, smudges, banding, ghosting, and faded print.",
    tags: ["root-cause", "printer", "defect", "matrix"],
    content:
      "White streaks usually map to clogged nozzle, low ink/toner, blocked printhead, media dust, transfer roller contamination, or incorrect density. Smudges map to fuser temperature, wet ink, dirty roller, or media mismatch. Banding maps to calibration, feed roller slip, or printhead alignment."
  },
  {
    id: "printer-maintenance-frequency",
    title: "Printer preventive maintenance frequency",
    type: "policy",
    referenceId: "PM-008",
    summary: "Preventive maintenance schedule for production printers.",
    tags: ["maintenance", "printer", "preventive", "schedule"],
    content:
      "Clean media path daily, run nozzle or test pattern at shift start, inspect rollers weekly, verify calibration after consumable changes, and record every cleaning or replacement in the maintenance log."
  },
  {
    id: "operator-escalation-rule",
    title: "Operator escalation rule",
    type: "policy",
    referenceId: "ESC-002",
    summary: "Escalation criteria for recurring or high-risk manufacturing defects.",
    tags: ["escalation", "operator", "quality", "defect"],
    content:
      "Escalate to quality engineer when the same defect appears in two consecutive checks, when safety or barcode readability is impacted, or when the first countermeasure fails. Include sample images, machine ID, material batch, operator, and timestamp."
  }
];
