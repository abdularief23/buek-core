import type { DynamicWorkspaceState } from "../components/DynamicWorkspace.js";
import type { NotificationItem } from "./data-api.js";

export function notificationToWorkspace(
  slug: string,
  notification: NotificationItem
): DynamicWorkspaceState | null {
  if (notification.id.startsWith("pending-wo-")) {
    return { kind: "approval-queue", slug };
  }
  if (notification.id.startsWith("pending-reports-")) {
    return { kind: "engineering-reports", slug };
  }

  if (notification.entityType === "engineering_report" && notification.entityId) {
    return { kind: "engineering-report", slug, reportId: notification.entityId };
  }
  if (notification.entityType === "work_order" && notification.entityId) {
    return { kind: "work-order", slug, workOrderId: notification.entityId };
  }
  if (notification.entityType === "issue" && notification.entityId) {
    return {
      kind: "investigation",
      slug,
      issueKey: notification.entityId.replace(`issue-${slug}-`, "")
    };
  }
  if (notification.entityType === "sop_revision" && notification.entityId) {
    return { kind: "sop-revision", slug, revisionId: notification.entityId };
  }

  return null;
}
