import { prisma } from "../db.js";
import { getSupervisorStats } from "./data-engine.js";
import { getCriticalAlerts } from "./business-rules.js";

export interface NotificationDto {
  id: string;
  category: string;
  message: string;
  prompt: string;
  time: string;
  entityType?: string;
  entityId?: string;
}

const categoryLabels: Record<string, string> = {
  maintenance: "Machine Alarm",
  quality: "Quality",
  production: "Production",
  approval: "Approval",
  safety: "Safety"
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

export async function getNotifications(slug: string): Promise<NotificationDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const [events, stats, criticalAlerts] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { workspaceId },
      orderBy: { occurredAt: "desc" },
      take: 25
    }),
    getSupervisorStats(slug),
    getCriticalAlerts(slug)
  ]);

  const notifications: NotificationDto[] = events.map((event) => ({
    id: event.id,
    category: categoryLabels[event.category] ?? event.category,
    message: event.detail ? `${event.title} — ${event.detail}` : event.title,
    prompt: `Tell me about: ${event.title}`,
    time: formatTime(event.occurredAt),
    ...(event.entityType ? { entityType: event.entityType } : {}),
    ...(event.entityId ? { entityId: event.entityId } : {})
  }));

  if (stats.pendingWorkOrders > 0) {
    notifications.unshift({
      id: `pending-wo-${slug}`,
      category: "Approval",
      message: `${stats.pendingWorkOrders} work order${stats.pendingWorkOrders > 1 ? "s" : ""} waiting approval`,
      prompt: "What work orders are waiting for my approval?",
      time: formatTime(new Date())
    });
  }

  if (stats.pendingReports > 0) {
    notifications.unshift({
      id: `pending-reports-${slug}`,
      category: "Quality",
      message: `${stats.pendingReports} engineering report${stats.pendingReports > 1 ? "s" : ""} pending review`,
      prompt: "Show pending engineering reports",
      time: formatTime(new Date()),
      entityType: "engineering_report",
      entityId: "queue"
    });
  }

  for (const alert of criticalAlerts.slice(0, 3)) {
    notifications.unshift({
      id: alert.id,
      category: "Business Rule",
      message: `🔴 ${alert.ruleName}: ${alert.message}`,
      prompt: `Explain critical alert: ${alert.ruleName}`,
      time: formatTime(new Date())
    });
  }

  return notifications.slice(0, 30);
}
