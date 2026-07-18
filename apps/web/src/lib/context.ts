import type { Workspace } from "../types.js";

export interface AiContext {
  label: string;
  details?: string[] | undefined;
  promptPrefix?: string;
}

export function contextForView(view: string, userRole?: string): AiContext {
  switch (view) {
    case "workspace":
      return { label: "AI Workspace", details: userRole ? [userRole] : undefined };
    case "knowledge":
      return { label: "Knowledge" };
    case "workflow":
      return { label: "Workflow" };
    case "profile":
      return { label: "Profile" };
    case "settings":
      return { label: "Settings" };
    default:
      return { label: "Home" };
  }
}

export function withContextPrompt(context: AiContext, prompt: string): string {
  if (context.promptPrefix) {
    return `${context.promptPrefix}${prompt}`;
  }
  if (context.label !== "Home" && context.label !== "Knowledge" && context.label !== "AI Workspace") {
    return `[Context: ${context.label}] ${prompt}`;
  }
  return prompt;
}

export function formatTodayDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

export function kpiStatusIcon(status: Workspace["kpis"][number]["status"]): string {
  if (status === "green") return "🟢";
  if (status === "yellow") return "🟡";
  return "🔴";
}

export function focusStatusColor(status: "green" | "yellow" | "red"): string {
  if (status === "green") return "text-emerald-400";
  if (status === "yellow") return "text-amber-400";
  return "text-red-400";
}
