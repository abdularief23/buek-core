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
  lessonsLearned: string;
  attachments: string[];
}

export interface ReportMeta {
  reportNumber: string;
  problem: string;
  issueId?: string;
  machine?: string;
  date: string;
  engineer: string;
  supervisor?: string;
  status: string;
  organization?: string;
  version?: number;
  approvedBy?: string;
  approvedAt?: string;
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
    lessonsLearned: "",
    attachments: []
  };
}

function sectionBlock(title: string, body: string): string[] {
  return ["", title, "────────────────────────", body || "____________________"];
}

export function renderReportDocument(meta: ReportMeta, sections: ReportSections): string {
  const attachmentLines =
    sections.attachments.length > 0
      ? sections.attachments.map((a) => `□ ${a}`).join("\n")
      : "□ Photo\n□ SOP\n□ Trend";

  const lines = [
    meta.organization ? meta.organization.toUpperCase() : "ENGINEERING INVESTIGATION REPORT",
    "ENGINEERING INVESTIGATION REPORT",
    "",
    `Report No   : ${meta.reportNumber}`,
    ...(meta.issueId ? [`Issue ID    : ${meta.issueId}`] : []),
    `Machine     : ${meta.machine ?? "—"}`,
    `Engineer    : ${meta.engineer}`,
    ...(meta.supervisor ? [`Supervisor  : ${meta.supervisor}`] : []),
    `Date        : ${meta.date}`,
    `Revision    : v${meta.version ?? 1}`,
    `Status      : ${meta.status.toUpperCase()}`,
    ...sectionBlock("PROBLEM", meta.problem),
    ...sectionBlock("EVIDENCE", sections.evidence || sections.background),
    ...sectionBlock("ANALYSIS", sections.analysis),
    ...sectionBlock("DECISION", sections.decision || sections.rootCause),
    ...sectionBlock("COUNTERMEASURE", sections.countermeasure),
    ...sectionBlock("EXECUTION PLAN", sections.executionPlan),
    ...sectionBlock("VERIFICATION", sections.verification),
    ...(sections.verificationResult
      ? sectionBlock("VERIFICATION RESULT", sections.verificationResult)
      : []),
    ...sectionBlock("LESSONS LEARNED", sections.lessonsLearned),
    "",
    "ATTACHMENTS",
    "────────────────────────",
    attachmentLines
  ];

  if (meta.status === "approved" && meta.approvedBy) {
    lines.push(
      "",
      "APPROVAL",
      "────────────────────────",
      `Approved By : ${meta.approvedBy}`,
      `Approved At : ${meta.approvedAt ?? meta.date}`
    );
  }

  return lines.join("\n");
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
    lessonsLearned: "",
    attachments: ["Photo", "SOP", "Trend"]
  };
}

export function generateReportNumber(workspaceSlug: string): string {
  const prefix = workspaceSlug.split("-")[0]?.slice(0, 3).toUpperCase() ?? "INV";
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-5);
  return `INV-${year}-${seq}`;
}
