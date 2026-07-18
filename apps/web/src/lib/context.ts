import type { RoleHomeData, Workspace } from "../types.js";

export interface AiContext {
  label: string;
  details?: string[];
  promptPrefix?: string;
  chatPersona?: string;
}

function withPersona(persona?: string): Pick<AiContext, "chatPersona"> {
  return persona ? { chatPersona: persona } : {};
}

export function contextForView(
  view: string,
  userRole?: string,
  roleHome?: RoleHomeData
): AiContext {
  const persona = roleHome?.chatPersona;

  switch (view) {
    case "workspace":
      return {
        label: "AI Workspace",
        ...(userRole ? { details: [userRole] } : {}),
        ...withPersona(persona)
      };
    case "knowledge":
      return { label: "Knowledge", ...withPersona(persona) };
    case "workflow":
      return { label: "Workflow", ...withPersona(persona) };
    case "profile":
      return { label: "Profile", ...withPersona(persona) };
    default:
      return {
        label: "Home",
        ...(roleHome ? { details: [roleHome.personaLabel] } : {}),
        ...withPersona(persona)
      };
  }
}

export function withContextPrompt(context: AiContext, prompt: string): string {
  const parts: string[] = [];

  if (context.chatPersona) {
    parts.push(`[AI Persona: ${context.chatPersona}]`);
  }

  if (context.promptPrefix) {
    parts.push(context.promptPrefix.trim());
  } else if (context.label !== "Home" && context.label !== "Knowledge" && context.label !== "AI Workspace") {
    parts.push(`[Context: ${context.label}]`);
  }

  if (context.details?.length) {
    parts.push(`[Details: ${context.details.join(" · ")}]`);
  }

  if (parts.length === 0) {
    return prompt;
  }

  return `${parts.join(" ")} ${prompt}`;
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
