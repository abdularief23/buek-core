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

/** Line-level approval — Supervisor only (not Plant Manager). */
export function canApprove(role: string): boolean {
  return isSupervisor(role);
}

export function canInvestigate(role: string): boolean {
  return isEngineer(role);
}

export function canSubmitOperatorReport(role: string): boolean {
  return isOperator(role);
}

export function canUseOperatorChecklist(role: string): boolean {
  return isOperator(role);
}

export function canDraftReport(role: string): boolean {
  return isEngineer(role);
}

export function assertRole(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
