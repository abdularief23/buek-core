import { countOpenComplaints, getComplaints } from "./customer-complaints.js";
import { getIssues } from "./data-engine.js";
import { countPendingReports, countPendingSopRevisions } from "./workflow-data.js";
import { prisma } from "../db.js";

export interface ChatDataContext {
  queried: boolean;
  dataAvailable: boolean;
  directAnswer?: string;
  snapshot: string;
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export async function resolveChatDataContext(
  workspaceSlug: string,
  userMessage: string
): Promise<ChatDataContext> {
  const text = userMessage.toLowerCase();
  const workspaceId = await getWorkspaceId(workspaceSlug);

  if (!workspaceId) {
    return {
      queried: true,
      dataAvailable: false,
      directAnswer:
        "Saya belum dapat mengakses data workspace ini. Silakan hubungi administrator atau coba masuk kembali.",
      snapshot: "Workspace tidak ditemukan."
    };
  }

  const pendingReportPatterns = [
    /pending\s+(engineering\s+)?reports?/i,
    /laporan\s+(engineering\s+)?pending/i,
    /engineering\s+reports?\s+pending/i,
    /menunggu\s+approval.*laporan/i
  ];

  if (matchesAny(text, pendingReportPatterns)) {
    const count = await countPendingReports(workspaceSlug);
    const rows = await prisma.engineeringReport.findMany({
      where: { workspaceId, status: "pending_approval" },
      include: { author: true, issue: true },
      take: 10,
      orderBy: { submittedAt: "desc" }
    });

    if (count === 0) {
      return {
        queried: true,
        dataAvailable: true,
        directAnswer:
          "Belum ada laporan engineering yang menunggu persetujuan saat ini. Semua laporan sudah ditinjau atau masih dalam tahap draft engineer.",
        snapshot: "Engineering reports pending_approval: 0"
      };
    }

    const list = rows
      .map(
        (r) =>
          `- ${r.reportNumber ?? r.id}: ${r.title} (${r.author?.name ?? "—"}, status: ${r.status})`
      )
      .join("\n");

    return {
      queried: true,
      dataAvailable: true,
      directAnswer: `Ada ${count} laporan engineering menunggu persetujuan:\n\n${list}\n\nBuka menu Engineering Reports untuk meninjau dan menyetujui.`,
      snapshot: `Pending engineering reports (${count}):\n${list}`
    };
  }

  const pendingWoPatterns = [
    /pending\s+work\s+orders?/i,
    /work\s+orders?\s+(waiting|pending)/i,
    /menunggu\s+approval.*work\s+order/i
  ];

  if (matchesAny(text, pendingWoPatterns)) {
    const count = await prisma.workOrder.count({
      where: { workspaceId, status: "pending_approval" }
    });
    const rows = await prisma.workOrder.findMany({
      where: { workspaceId, status: "pending_approval" },
      include: { machine: true, engineer: true },
      take: 10
    });

    if (count === 0) {
      return {
        queried: true,
        dataAvailable: true,
        directAnswer: "Belum ada work order yang menunggu persetujuan saat ini.",
        snapshot: "Work orders pending_approval: 0"
      };
    }

    const list = rows
      .map((w) => `- ${w.number}: ${w.title} (${w.machine?.code ?? "—"}, ${w.engineer?.name ?? "—"})`)
      .join("\n");

    return {
      queried: true,
      dataAvailable: true,
      directAnswer: `Ada ${count} work order menunggu persetujuan:\n\n${list}`,
      snapshot: `Pending work orders (${count}):\n${list}`
    };
  }

  const complaintPatterns = [
    /customer\s+complaint/i,
    /keluhan\s+(pelanggan|customer)/i,
    /complaint\s+(customer|pelanggan)/i
  ];

  if (matchesAny(text, complaintPatterns)) {
    const complaints = await getComplaints(workspaceSlug, ["open", "investigating"]);

    if (!complaints.length) {
      return {
        queried: true,
        dataAvailable: true,
        directAnswer:
          "Saya belum menemukan data Customer Complaint yang aktif pada workspace ini.\n\nKemungkinan penyebab:\n• Modul Customer Complaint belum diaktifkan.\n• Belum ada data complaint yang masuk.\n\nSilakan hubungi administrator atau sinkronkan data CRM.",
        snapshot: "Customer complaints: 0 active"
      };
    }

    const list = complaints
      .map(
        (c) =>
          `- ${c.complaintNumber}: ${c.customerName} — ${c.product} (${c.priority}, ${c.status}, PIC: ${c.engineer?.name ?? "—"})`
      )
      .join("\n");

    return {
      queried: true,
      dataAvailable: true,
      directAnswer: `Ditemukan ${complaints.length} customer complaint aktif:\n\n${list}\n\nBuka detail complaint dari Home untuk investigasi lebih lanjut.`,
      snapshot: `Active customer complaints (${complaints.length}):\n${list}`
    };
  }

  const openIssuePatterns = [/open\s+issues?/i, /isu\s+terbuka/i, /status.*issues?/i];

  if (matchesAny(text, openIssuePatterns)) {
    const issues = await getIssues(workspaceSlug, ["open", "investigating"]);

    if (!issues.length) {
      return {
        queried: true,
        dataAvailable: true,
        directAnswer: "Tidak ada isu terbuka saat ini. Produksi berjalan tanpa isu yang perlu investigasi.",
        snapshot: "Open issues: 0"
      };
    }

    const list = issues
      .slice(0, 8)
      .map(
        (i) =>
          `- ${i.machine?.code ?? "—"}: ${i.title} (${i.status}, owner: ${i.owner?.name ?? "—"})`
      )
      .join("\n");

    return {
      queried: true,
      dataAvailable: true,
      directAnswer: `Ada ${issues.length} isu terbuka:\n\n${list}`,
      snapshot: `Open issues (${issues.length}):\n${list}`
    };
  }

  const [pendingReports, pendingSop, openComplaints, openIssues] = await Promise.all([
    countPendingReports(workspaceSlug),
    countPendingSopRevisions(workspaceSlug),
    countOpenComplaints(workspaceSlug),
    getIssues(workspaceSlug, ["open", "investigating"]).then((i) => i.length)
  ]);

  return {
    queried: false,
    dataAvailable: true,
    snapshot: [
      `Workspace snapshot (${workspaceSlug}):`,
      `- Open issues: ${openIssues}`,
      `- Pending work orders: (query on demand)`,
      `- Pending engineering reports: ${pendingReports}`,
      `- Pending SOP revisions: ${pendingSop}`,
      `- Active customer complaints: ${openComplaints}`
    ].join("\n")
  };
}

export function shouldUseDirectAnswer(context: ChatDataContext, userMessage: string): boolean {
  if (!context.directAnswer) return false;
  const text = userMessage.toLowerCase();
  const dataQueryPatterns = [
    /^(show|list|what|berapa|ada|tampilkan|lihat)\b/i,
    /pending/i,
    /menunggu/i,
    /status/i,
    /complaint/i,
    /keluhan/i
  ];
  return context.queried && dataQueryPatterns.some((p) => p.test(text));
}
