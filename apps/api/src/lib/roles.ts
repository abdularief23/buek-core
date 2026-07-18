export function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

export function canApprove(role: string): boolean {
  const r = normalizeRole(role);
  return r.includes("supervisor") || r.includes("manager") || r.includes("plant");
}

export function isOperator(role: string): boolean {
  return normalizeRole(role).includes("operator");
}

export function isEngineer(role: string): boolean {
  const r = normalizeRole(role);
  return r.includes("engineer") && !canApprove(r);
}
