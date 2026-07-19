import { prisma } from "../db.js";

export interface ComplaintTimelineEntry {
  time: string;
  title: string;
}

export interface CustomerComplaintDto {
  id: string;
  complaintNumber: string;
  customerName: string;
  product: string;
  priority: string;
  status: string;
  description?: string;
  reportedAt: string;
  dueAt?: string;
  engineer?: { name: string };
  timeline: ComplaintTimelineEntry[];
  attachments: string[];
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

function mapComplaint(row: {
  id: string;
  complaintNumber: string;
  customerName: string;
  product: string;
  priority: string;
  status: string;
  description: string | null;
  reportedAt: Date;
  dueAt: Date | null;
  timeline: unknown;
  attachments: unknown;
  engineer: { name: string } | null;
}): CustomerComplaintDto {
  return {
    id: row.id,
    complaintNumber: row.complaintNumber,
    customerName: row.customerName,
    product: row.product,
    priority: row.priority,
    status: row.status,
    ...(row.description ? { description: row.description } : {}),
    reportedAt: row.reportedAt.toISOString(),
    ...(row.dueAt ? { dueAt: row.dueAt.toISOString() } : {}),
    ...(row.engineer ? { engineer: { name: row.engineer.name } } : {}),
    timeline: (row.timeline as ComplaintTimelineEntry[] | null) ?? [],
    attachments: (row.attachments as string[] | null) ?? []
  };
}

export async function countOpenComplaints(slug: string): Promise<number> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return 0;
  return prisma.customerComplaint.count({
    where: { workspaceId, status: { in: ["open", "investigating"] } }
  });
}

export async function getComplaints(slug: string, status?: string[]): Promise<CustomerComplaintDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rows = await prisma.customerComplaint.findMany({
    where: {
      workspaceId,
      ...(status?.length ? { status: { in: status } } : {})
    },
    include: { engineer: true },
    orderBy: { reportedAt: "desc" }
  });

  return rows.map(mapComplaint);
}

export async function getComplaintById(slug: string, id: string): Promise<CustomerComplaintDto | null> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return null;

  const row = await prisma.customerComplaint.findFirst({
    where: { id, workspaceId },
    include: { engineer: true }
  });
  if (!row) return null;
  return mapComplaint(row);
}
