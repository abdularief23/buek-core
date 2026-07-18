export interface ReportSections {
  background: string;
  evidence: string;
  rootCause: string;
  countermeasure: string;
  verification: string;
  attachments: string[];
}

export interface ReportMeta {
  reportNumber: string;
  problem: string;
  machine?: string;
  date: string;
  engineer: string;
  status: string;
}

export function emptyReportSections(): ReportSections {
  return {
    background: "",
    evidence: "",
    rootCause: "",
    countermeasure: "",
    verification: "",
    attachments: []
  };
}

export function renderReportDocument(meta: ReportMeta, sections: ReportSections): string {
  const attachmentLines =
    sections.attachments.length > 0
      ? sections.attachments.map((a) => `□ ${a}`).join("\n")
      : "□ Photo\n□ SOP\n□ Trend";

  return [
    "INVESTIGATION REPORT",
    "--------------------------------",
    `Problem     : ${meta.problem}`,
    `Machine     : ${meta.machine ?? "—"}`,
    `Date        : ${meta.date}`,
    `Engineer    : ${meta.engineer}`,
    `Document No : ${meta.reportNumber}`,
    "--------------------------------",
    "",
    "1. Background",
    "--------------------------------",
    sections.background || "____________________",
    "",
    "2. Evidence",
    "--------------------------------",
    sections.evidence || "____________________",
    "",
    "3. Root Cause",
    "--------------------------------",
    sections.rootCause || "____________________",
    "",
    "4. Countermeasure",
    "--------------------------------",
    sections.countermeasure || "____________________",
    "",
    "5. Verification",
    "--------------------------------",
    sections.verification || "____________________",
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
    rootCause: "",
    countermeasure: "",
    verification: "",
    attachments: ["Photo", "SOP", "Trend"]
  };
}

export function generateReportNumber(workspaceSlug: string): string {
  const prefix = workspaceSlug.split("-")[0]?.slice(0, 3).toUpperCase() ?? "INV";
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const seq = String(Date.now()).slice(-4);
  return `${prefix}-${stamp}-${seq}`;
}
