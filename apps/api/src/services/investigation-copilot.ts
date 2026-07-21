import { prisma } from "../db.js";
import { getTenantThemeOrDefault } from "../tenants/index.js";
import { parseProductionContext, type ProductionContext } from "./production-metrics.js";

export interface PossibleCauseDto {
  id: string;
  label: string;
  confidence: number;
  evidence: string[];
}

export interface CountermeasureOptionDto {
  id: string;
  label: string;
  category: string;
  confidence: number;
  linkedCauseId: string;
}

export interface ExecutionPlanDto {
  pic: string;
  dueDate: string;
  machineStop: boolean;
  materialNeeded: string;
  estimatedDowntime: string;
}

export interface InvestigationCopilotDto {
  issueKey: string;
  issueTitle: string;
  machineCode?: string;
  autoLoadedContext: string[];
  similarCases: Array<{ id: string; title: string; reference?: string }>;
  sopReferences: Array<{ id: string; title: string; referenceId?: string }>;
  possibleCauses: PossibleCauseDto[];
  countermeasureOptions: CountermeasureOptionDto[];
  defaultExecutionPlan: ExecutionPlanDto;
}

function cm(
  id: string,
  label: string,
  category: string,
  linkedCauseId: string,
  confidence: number
): CountermeasureOptionDto {
  return { id, label, category, linkedCauseId, confidence };
}

function withProductionContext(
  pack: Omit<InvestigationCopilotDto, "issueKey" | "issueTitle" | "machineCode">,
  production: ProductionContext | null
): Omit<InvestigationCopilotDto, "issueKey" | "issueTitle" | "machineCode"> {
  if (!production) return pack;

  const ngLine = `Operator NG report: ${production.rejectCount} pcs from ${production.totalProduction.toLocaleString("en-US")} total (${production.ngRatePercent}% NG, PPM ${production.ppm.toLocaleString("en-US")})`;
  const phenomenonLine = production.ngPhenomenon
    ? `NG phenomenon observed: ${production.ngPhenomenon}`
    : null;

  return {
    ...pack,
    autoLoadedContext: [ngLine, ...(phenomenonLine ? [phenomenonLine] : []), ...pack.autoLoadedContext],
    possibleCauses: pack.possibleCauses.map((cause) => ({
      ...cause,
      evidence: [
        `NG volume supports ${cause.confidence >= 70 ? "strong" : "moderate"} correlation`,
        ...cause.evidence
      ]
    }))
  };
}

function copilotForIssue(
  title: string,
  machineCode?: string
): Omit<InvestigationCopilotDto, "issueKey" | "issueTitle" | "machineCode"> {
  const lower = title.toLowerCase();

  if (lower.includes("white") || lower.includes("streak") || lower.includes("print")) {
    return {
      autoLoadedContext: [
        "Machine telemetry — vibration trend normal",
        "Maintenance history — nozzle cleaned 3 days ago",
        "KPI — PPM Line 2 elevated +12%",
        "Open work orders — none on M-312"
      ],
      similarCases: [
        { id: "c1", title: "White Streak M-308", reference: "INV-2025-0412" },
        { id: "c2", title: "Ink Pressure Drop Line 2", reference: "INV-2025-0388" }
      ],
      sopReferences: [
        { id: "s1", title: "Print Head Nozzle Cleaning", referenceId: "SOP-014" },
        { id: "s2", title: "White Streak Troubleshooting", referenceId: "WI-QC-022" }
      ],
      possibleCauses: [
        { id: "pc1", label: "Print Head Nozzle Clog", confidence: 82, evidence: ["vibration normal", "similar case x4", "reject pattern"] },
        { id: "pc2", label: "Ink Pressure Instability", confidence: 63, evidence: ["pressure log spike", "ink consumption +18%"] },
        { id: "pc3", label: "Bearing Wear (feeder)", confidence: 41, evidence: ["maintenance due", "minor vibration"] },
        { id: "pc4", label: "Sensor Drift", confidence: 35, evidence: ["calibration overdue 2 weeks"] }
      ],
      countermeasureOptions: [
        cm("cm1", "Nozzle cleaning & purge cycle", "corrective", "pc1", 88),
        cm("cm2", "Replace ink filter", "corrective", "pc1", 76),
        cm("cm3", "Recalibrate print head", "adjustment", "pc2", 71),
        cm("cm4", "Increase inspection frequency", "monitoring", "pc1", 58),
        cm("cm5", "Need more inspection — hold batch", "hold", "pc3", 46)
      ],
      defaultExecutionPlan: {
        pic: "Maintenance Team",
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        machineStop: true,
        materialNeeded: "Ink filter kit, cleaning solvent",
        estimatedDowntime: "45 min"
      }
    };
  }

  if (lower.includes("torque") || lower.includes("engine") || lower.includes("weld")) {
    return {
      autoLoadedContext: [
        "Torque log EA-04 — drift detected last 2 shifts",
        "SOP ASM-022 — torque specification",
        "Similar cases — 3 in Company Brain",
        "KPI — Quality torque compliance 94%"
      ],
      similarCases: [
        { id: "c1", title: "Torque Drift EA-02", reference: "INV-2025-0521" },
        { id: "c2", title: "Engine Mount Misalignment", reference: "INV-2025-0499" }
      ],
      sopReferences: [
        { id: "s1", title: "Torque Tool Calibration", referenceId: "ASM-022" },
        { id: "s2", title: "Engine Mount Inspection WI", referenceId: "WI-ASM-014" }
      ],
      possibleCauses: [
        { id: "pc1", label: "Torque Tool Drift", confidence: 84, evidence: ["calibration log", "3 similar cases", "EA-04 pattern"] },
        { id: "pc2", label: "Shaft Misalignment", confidence: 63, evidence: ["vibration +0.3mm", "maintenance history"] },
        { id: "pc3", label: "Bolt Grade Mismatch", confidence: 41, evidence: ["supplier lot change"] },
        { id: "pc4", label: "Operator Technique Variation", confidence: 28, evidence: ["shift comparison"] }
      ],
      countermeasureOptions: [
        cm("cm1", "Recalibrate torque tool EA-04", "corrective", "pc1", 86),
        cm("cm2", "Shaft alignment check", "inspection", "pc2", 74),
        cm("cm3", "Replace torque socket", "corrective", "pc1", 69),
        cm("cm4", "Operator re-training", "training", "pc4", 52),
        cm("cm5", "Hold chassis batch for 100% check", "hold", "pc3", 48)
      ],
      defaultExecutionPlan: {
        pic: "Assembly Engineer",
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        machineStop: false,
        materialNeeded: "Torque socket EA-04 spare",
        estimatedDowntime: "20 min"
      }
    };
  }

  if (lower.includes("metal") || lower.includes("haccp") || lower.includes("packaging")) {
    return {
      autoLoadedContext: [
        "HACCP CCP-03 — metal detector log",
        "Batch hold status — active on P-03",
        "Customer complaint risk — medium",
        "Maintenance — detector calibrated 1 week ago"
      ],
      similarCases: [
        { id: "c1", title: "Metal Detector False Positive P-01", reference: "HACCP-2025-008" },
        { id: "c2", title: "Packaging Seal Failure", reference: "INV-2025-0331" }
      ],
      sopReferences: [
        { id: "s1", title: "HACCP Metal Detector Response", referenceId: "HACCP-011" },
        { id: "s2", title: "Batch Hold & Release", referenceId: "SOP-FS-003" }
      ],
      possibleCauses: [
        { id: "pc1", label: "Foreign Material in Packaging Line", confidence: 76, evidence: ["detector alarm", "batch trace"] },
        { id: "pc2", label: "Detector Sensitivity Drift", confidence: 58, evidence: ["calibration due", "2 false alarms/week"] },
        { id: "pc3", label: "Supplier Packaging Contamination", confidence: 45, evidence: ["lot change", "similar supplier case"] },
        { id: "pc4", label: "Seal Integrity Failure", confidence: 38, evidence: ["visual inspection gap"] }
      ],
      countermeasureOptions: [
        cm("cm1", "Isolate & inspect affected batch", "hold", "pc1", 84),
        cm("cm2", "Recalibrate metal detector", "corrective", "pc2", 72),
        cm("cm3", "Supplier lot quarantine", "supplier", "pc3", 66),
        cm("cm4", "Increase CCP monitoring frequency", "monitoring", "pc2", 55),
        cm("cm5", "Line cleaning & foreign object search", "corrective", "pc1", 49)
      ],
      defaultExecutionPlan: {
        pic: "QA / Food Safety",
        dueDate: new Date(Date.now() + 43200000).toISOString().slice(0, 10),
        machineStop: true,
        materialNeeded: "Test pieces, calibration kit",
        estimatedDowntime: "2 hours"
      }
    };
  }

  return {
    autoLoadedContext: [
      `Machine ${machineCode ?? "—"} history loaded`,
      "SOP index searched",
      "Similar cases from Company Brain",
      "KPI snapshot attached"
    ],
    similarCases: [{ id: "c1", title: "Bearing vibration alarm", reference: "INV-2025-0201" }],
    sopReferences: [{ id: "s1", title: "General Troubleshooting WI", referenceId: "WI-GEN-001" }],
    possibleCauses: [
      { id: "pc1", label: "Bearing Wear", confidence: 81, evidence: ["vibration trend", "maintenance history", "similar case"] },
      { id: "pc2", label: "Shaft Misalignment", confidence: 63, evidence: ["telemetry offset"] },
      { id: "pc3", label: "Lubrication Insufficient", confidence: 41, evidence: ["PM overdue"] },
      { id: "pc4", label: "Sensor Drift", confidence: 35, evidence: ["calibration log"] }
    ],
    countermeasureOptions: [
      cm("cm1", "Replace bearing", "corrective", "pc1", 82),
      cm("cm2", "Alignment check", "inspection", "pc2", 70),
      cm("cm3", "Lubrication service", "preventive", "pc3", 61),
      cm("cm4", "Increase monitoring", "monitoring", "pc1", 54),
      cm("cm5", "Need more inspection", "hold", "pc4", 44)
    ],
    defaultExecutionPlan: {
      pic: "Maintenance",
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      machineStop: true,
      materialNeeded: "Bearing kit",
      estimatedDowntime: "60 min"
    }
  };
}

export async function getInvestigationCopilot(slug: string, issueKey: string): Promise<InvestigationCopilotDto | null> {
  const workspaceId = (await prisma.workspace.findUnique({ where: { slug } }))?.id;
  if (!workspaceId) return null;

  const issue = await prisma.issue.findFirst({
    where: { workspaceId, id: { endsWith: issueKey } },
    include: { machine: true }
  });
  if (!issue) return null;

  getTenantThemeOrDefault(slug);
  const production = parseProductionContext(issue.description);
  const pack = withProductionContext(
    copilotForIssue(issue.title, issue.machine?.code),
    production
  );

  return {
    issueKey,
    issueTitle: issue.title,
    ...(issue.machine?.code ? { machineCode: issue.machine.code } : {}),
    ...pack
  };
}

export const ENGINEERING_WORKFLOW_STEPS = [
  { key: "reported", label: "Problem Created" },
  { key: "evidence", label: "Collect Evidence" },
  { key: "similar_cases", label: "Review Similar Cases" },
  { key: "sop_review", label: "Review SOP" },
  { key: "possible_cause", label: "Choose Possible Cause" },
  { key: "ai_analysis", label: "AI Analysis" },
  { key: "engineer_decision", label: "Engineer Decision" },
  { key: "countermeasure", label: "Countermeasure" },
  { key: "execution_plan", label: "Execution Plan" },
  { key: "verification", label: "Verification" },
  { key: "technical_report", label: "Generate Technical Report" },
  { key: "approval", label: "Submit Approval" },
  { key: "lessons_learned", label: "Lessons Learned" }
] as const;

export function defaultInvestigationSteps() {
  return ENGINEERING_WORKFLOW_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    done: index === 0
  }));
}

/** Map legacy progress % to 12-step workflow for seed/demo data. */
export function investigationStepsForProgress(progress: number) {
  const doneCount = Math.max(1, Math.round((progress / 100) * ENGINEERING_WORKFLOW_STEPS.length));
  return ENGINEERING_WORKFLOW_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    done: index < doneCount
  }));
}
