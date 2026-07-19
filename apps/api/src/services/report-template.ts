export interface ReportSections {
  background: string;
  evidence: string;
  analysis: string;
  decision: string;
  rootCause: string;
  countermeasure: string;
  executionPlan: string;
  verification: string;
  verificationResult: string;
  attachments: string[];
}

export interface ReportMeta {
  reportNumber: string;
  problem: string;
  machine?: string;
  date: string;
  engineer: string;
  status: string;
  organization?: string;
  version?: number;
}

export function emptyReportSections(): ReportSections {
  return {
    background: "",
    evidence: "",
    analysis: "",
    decision: "",
    rootCause: "",
    countermeasure: "",
    executionPlan: "",
    verification: "",
    verificationResult: "",
    attachments: []
  };
}

export function renderReportDocument(meta: ReportMeta, sections: ReportSections): string {
  const attachmentLines =
    sections.attachments.length > 0
      ? sections.attachments.map((a) => `□ ${a}`).join("\n")
      : "□ Photo\n□ SOP\n□ Trend";

  return [
    meta.organization ? meta.organization.toUpperCase() : "ENGINEERING INVESTIGATION REPORT",
    "ENGINEERING INVESTIGATION REPORT",
    "--------------------------------",
    `Report No   : ${meta.reportNumber}`,
    `Machine     : ${meta.machine ?? "—"}`,
    `Engineer    : ${meta.engineer}`,
    `Date        : ${meta.date}`,
    `Document    : v${meta.version ?? 1} · ${meta.status.toUpperCase()}`,
    "--------------------------------",
    "",
    "PROBLEM",
    "--------------------------------",
    meta.problem,
    "",
    "EVIDENCE",
    "--------------------------------",
    sections.evidence || sections.background || "____________________",
    "",
    "ANALYSIS",
    "--------------------------------",
    sections.analysis || "____________________",
    "",
    "DECISION",
    "--------------------------------",
    sections.decision || sections.rootCause || "____________________",
    "",
    "COUNTERMEASURE",
    "--------------------------------",
    sections.countermeasure || "____________________",
    "",
    "EXECUTION PLAN",
    "--------------------------------",
    sections.executionPlan || "____________________",
    "",
    "VERIFICATION",
    "--------------------------------",
    sections.verification || "____________________",
    ...(sections.verificationResult
      ? ["", "VERIFICATION RESULT", "--------------------------------", sections.verificationResult]
      : []),
    "",
    "Attachments",
    "--------------------------------",
    attachmentLines,
    "",
    "Status",
    "--------------------------------",
    meta.status.toUpperCase()
  ].join("\n");
}

export function buildDraftSectionsFromIssue(issue: {
  title: string;
  description?: string | null;
  machineCode?: string;
}): ReportSections {
  return {
    background: issue.description ?? `Investigation opened for ${issue.title}.`,
    evidence: `Machine ${issue.machineCode ?? "—"} observed defect pattern during production run.`,
    analysis: "",
    decision: "",
    rootCause: "",
    countermeasure: "",
    executionPlan: "",
    verification: "",
    verificationResult: "",
    attachments: ["Photo", "SOP", "Trend"]
  };
}

export function generateReportNumber(workspaceSlug: string): string {
  const prefix = workspaceSlug.split("-")[0]?.slice(0, 3).toUpperCase() ?? "INV";
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const seq = String(Date.now()).slice(-4);
  return `${prefix}-${stamp}-${seq}`;
}
