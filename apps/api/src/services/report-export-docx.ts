import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";
import type { ReportSections } from "./report-template.js";

export interface ReportDocxInput {
  reportNumber: string;
  problem: string;
  machine?: string;
  date: string;
  engineer: string;
  status: string;
  version: number;
  sections?: ReportSections | null;
  content: string;
  organization?: string;
  reportTitle?: string;
  approvedBy?: string;
  approvedAt?: string;
}

function sectionParagraph(label: string, body: string): Paragraph[] {
  return [
    new Paragraph({
      text: label,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun(body || "____________________")]
    })
  ];
}

export async function renderReportDocx(report: ReportDocxInput): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: report.reportTitle ?? "INVESTIGATION REPORT",
          bold: true,
          size: 28
        })
      ],
      alignment: "center",
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            report.organization,
            report.reportNumber,
            `v${report.version}`,
            report.status.toUpperCase()
          ]
            .filter(Boolean)
            .join(" · "),
          size: 20,
          color: "666666"
        })
      ],
      alignment: "center",
      spacing: { after: 300 }
    }),
    new Paragraph({ text: `Problem: ${report.problem}` }),
    new Paragraph({ text: `Machine: ${report.machine ?? "—"}` }),
    new Paragraph({ text: `Date: ${report.date}` }),
    new Paragraph({ text: `Engineer: ${report.engineer}` }),
    new Paragraph({ text: `Document No: ${report.reportNumber}`, spacing: { after: 300 } })
  ];

  if (report.sections) {
    children.push(
      ...sectionParagraph("1. Background", report.sections.background),
      ...sectionParagraph("2. Evidence", report.sections.evidence),
      ...sectionParagraph("3. Root Cause", report.sections.rootCause),
      ...sectionParagraph("4. Countermeasure", report.sections.countermeasure),
      ...sectionParagraph("5. Verification", report.sections.verification),
      new Paragraph({
        text: "Attachments",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
      }),
      ...(report.sections.attachments ?? ["Photo", "SOP", "Trend"]).map(
        (item) => new Paragraph({ text: `□ ${item}` })
      )
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun(report.content)],
        spacing: { before: 200 }
      })
    );
  }

  children.push(
    new Paragraph({
      text: `Status: ${report.status.toUpperCase()}`,
      spacing: { before: 300 }
    })
  );

  if (report.status === "approved" && report.approvedBy) {
    children.push(
      new Paragraph({
        text: "Approval",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
      }),
      new Paragraph({ text: `Approved by: ${report.approvedBy}` }),
      new Paragraph({ text: `Approved at: ${report.approvedAt ?? "—"}` })
    );
  }

  const doc = new Document({
    sections: [{ children }]
  });

  return Packer.toBuffer(doc);
}
