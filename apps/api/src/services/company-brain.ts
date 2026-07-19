import { prisma } from "../db.js";

export interface CompanyBrainReportNode {
  id: string;
  reportNumber: string;
  title: string;
  status: string;
  countermeasure?: string;
}

export interface CompanyBrainIssueNode {
  id: string;
  issueKey: string;
  title: string;
  status: string;
  createdAt: string;
  createdBy: string;
  reports: CompanyBrainReportNode[];
  lessonsLearned: Array<{ id: string; title: string; content: string }>;
  countermeasures: string[];
}

export interface CompanyBrainMachineNode {
  code: string;
  name: string;
  issues: CompanyBrainIssueNode[];
}

export interface CompanyBrainHierarchy {
  machines: CompanyBrainMachineNode[];
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

function extractCountermeasure(content: string | null | undefined): string | undefined {
  if (!content) return undefined;
  const match = content.match(/Countermeasure:\s*(.+)/i);
  return match?.[1]?.trim();
}

export async function getCompanyBrainHierarchy(slug: string): Promise<CompanyBrainHierarchy> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return { machines: [] };

  const machines = await prisma.machine.findMany({
    where: { line: { plant: { workspaceId } } },
    include: {
      issues: {
        include: {
          owner: true,
          reports: {
            orderBy: { updatedAt: "desc" },
            take: 5
          },
          lessonsLearned: {
            orderBy: { createdAt: "desc" },
            take: 5
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 8
      }
    },
    orderBy: { code: "asc" }
  });

  return {
    machines: machines
      .filter((machine) => machine.issues.length > 0)
      .map((machine) => ({
        code: machine.code,
        name: machine.name,
        issues: machine.issues.map((issue) => {
          const reports = issue.reports.map((report) => {
            const sections = report.sections as { countermeasure?: string } | null;
            const countermeasure = sections?.countermeasure ?? extractCountermeasure(report.content);
            const node: CompanyBrainReportNode = {
              id: report.id,
              reportNumber: report.reportNumber ?? report.id,
              title: report.title,
              status: report.status
            };
            if (countermeasure) node.countermeasure = countermeasure;
            return node;
          });

          const countermeasures = reports
            .map((r) => r.countermeasure)
            .filter((value): value is string => Boolean(value));

          return {
            id: issue.id,
            issueKey: issue.id.replace(`issue-${slug}-`, ""),
            title: issue.title,
            status: issue.status,
            createdAt: issue.createdAt.toISOString(),
            createdBy: issue.owner?.name ?? "System",
            reports,
            lessonsLearned: issue.lessonsLearned.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              content: lesson.content
            })),
            countermeasures
          };
        })
      }))
  };
}
