import type { AppNavItem } from "@buek/ui";
import type { DynamicWorkspaceState } from "../components/DynamicWorkspace.js";

export type RoleKey = "operator" | "engineer" | "supervisor" | "manager";

export function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

export function roleKey(role: string): RoleKey {
  const normalized = normalizeRole(role);
  if (normalized.includes("operator")) return "operator";
  if (normalized.includes("supervisor")) return "supervisor";
  if (normalized.includes("manager") || normalized.includes("plant")) return "manager";
  return "engineer";
}

export function isOperator(role: string): boolean {
  return roleKey(role) === "operator";
}

export function isEngineer(role: string): boolean {
  return roleKey(role) === "engineer";
}

export function isSupervisor(role: string): boolean {
  return roleKey(role) === "supervisor";
}

export function isPlantManager(role: string): boolean {
  return roleKey(role) === "manager";
}

/** Line-level approval — Supervisor only. */
export function canApprove(role: string): boolean {
  return isSupervisor(role);
}

export function canInvestigate(role: string): boolean {
  return isEngineer(role);
}

export function canDraftReport(role: string): boolean {
  return isEngineer(role);
}

export function navItemsForRole(role: string): AppNavItem[] {
  switch (roleKey(role)) {
    case "operator":
      return ["home", "knowledge", "profile"];
    case "manager":
      return ["home", "workspace", "knowledge", "profile"];
    default:
      return ["home", "workspace", "knowledge", "workflow", "profile"];
  }
}

export function canAccessWorkspace(kind: DynamicWorkspaceState["kind"], role: string): boolean {
  const key = roleKey(role);

  if (key === "operator") {
    return false;
  }

  if (key === "manager") {
    return !["approval-queue", "work-order", "sop-revisions", "sop-revision", "engineering-reports"].includes(
      kind
    );
  }

  return true;
}

export type CopilotModeId = "summarize" | "analyze" | "search" | "draft";

export function copilotModesForRole(role: string): CopilotModeId[] {
  switch (roleKey(role)) {
    case "operator":
      return ["summarize", "search"];
    case "engineer":
      return ["summarize", "analyze", "search", "draft"];
    case "supervisor":
      return ["summarize", "analyze", "search"];
    case "manager":
      return ["summarize", "analyze"];
    default:
      return ["summarize", "search"];
  }
}
