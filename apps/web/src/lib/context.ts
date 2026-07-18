import type { Workspace } from "../types.js";

export interface AiContext {
  label: string;
  promptPrefix?: string;
}

export function contextForView(view: string): AiContext {
  switch (view) {
    case "knowledge":
      return { label: "Knowledge" };
    case "notifications":
      return { label: "Notifications" };
    case "settings":
      return { label: "Settings" };
    default:
      return { label: "Daily Workspace" };
  }
}

export function withContextPrompt(context: AiContext, prompt: string): string {
  if (context.promptPrefix) {
    return `${context.promptPrefix}${prompt}`;
  }
  if (context.label !== "Daily Workspace" && context.label !== "Knowledge") {
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
