import type { DailyWorkspace } from "./daily-workspace.js";

export type RoleKey = "operator" | "engineer" | "supervisor" | "manager";

export interface RoleHomeData {
  roleKey: RoleKey;
  personaLabel: string;
  chatPersona: string;
  copilotSuggestions: Array<{ label: string; prompt: string }>;
  operator?: {
    line: string;
    shift: string;
    targetOutput: number;
    progress: number;
    checklist: Array<{ id: string; label: string; done: boolean }>;
    qualityReminders: string[];
  };
  engineer?: {
    problems: Array<{
      id: string;
      severity: "critical" | "warning" | "attention";
      icon: string;
      title: string;
      detail: string;
      actionLabel: string;
      prompt: string;
      contextLabel: string;
      action?: string;
      issueKey?: string;
    }>;
    investigations: Array<{ id: string; label: string; prompt: string }>;
    aiSuggestions: Array<{
      id: string;
      title: string;
      candidate: string;
      confidence: string;
      prompt: string;
    }>;
    workflowSteps: string[];
  };
  supervisor?: {
    overview: Array<{ label: string; status: "green" | "yellow" | "red" }>;
    waitingApproval: Array<{ label: string; count: number; prompt?: string; action?: string }>;
    openIssues: Array<{
      id: string;
      title: string;
      owner: string;
      status: string;
      prompt: string;
    }>;
    teamPerformance: Array<{ name: string; closed: number; pending: number }>;
  };
  manager?: {
    factoryOverview: Array<{ label: string; value: string; status: "green" | "yellow" | "red" }>;
    criticalIssues: Array<{ id: string; title: string; prompt: string }>;
    weeklyTrend: Array<{ label: string; trend: "up" | "down" | "flat" }>;
    executiveSummary: string[];
  };
}

export function normalizeRoleKey(role: string): RoleKey {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes("operator")) return "operator";
  if (normalized.includes("supervisor")) return "supervisor";
  if (normalized.includes("manager") || normalized.includes("plant")) return "manager";
  return "engineer";
}

function operatorHome(workspaceId: string) {
  const isToyota = workspaceId === "toyota-plant";
  return {
    line: isToyota ? "EA Line" : "Line 3",
    shift: "Shift A",
    targetOutput: 420,
    progress: 165,
    checklist: [
      { id: "c1", label: "First Article Inspection", done: true },
      { id: "c2", label: "Torque Check", done: false },
      { id: "c3", label: "Material Verification", done: false },
      { id: "c4", label: "Final Cleaning", done: false }
    ],
    qualityReminders: ["Do not skip checkpoint #4", "Use SOP-014 Rev.5"]
  };
}

function engineerHome(workspaceId: string, daily: DailyWorkspace) {
  const isToyota = workspaceId === "toyota-plant";
  const machine = isToyota ? "Machine EA-04" : "Machine M-12";
  const machinePrompt = isToyota
    ? "What happened with Machine EA-04 yesterday?"
    : "Machine 12 alarm terus — show bearing vibration details";

  return {
    problems: [
      {
        id: "p1",
        severity: "critical" as const,
        icon: "🔴",
        title: `${machine} vibration`,
        detail: isToyota ? "Torque drift detected" : "Likely bearing wear",
        actionLabel: "Investigate",
        prompt: machinePrompt,
        contextLabel: machine,
        action: "investigation",
        issueKey: "vibration"
      },
      {
        id: "p2",
        severity: "warning" as const,
        icon: "🟠",
        title: "White streak +18%",
        detail: "Compared with yesterday",
        actionLabel: "Root Cause",
        prompt: "Continue white streak investigation — root cause analysis",
        contextLabel: "White Streak Investigation",
        action: "investigation",
        issueKey: "white-streak"
      },
      {
        id: "p3",
        severity: "attention" as const,
        icon: "🟡",
        title: "Supplier issue",
        detail: "1 delayed shipment",
        actionLabel: "Review",
        prompt: "Summarize supplier delay impact on today's production",
        contextLabel: "Supplier"
      }
    ],
    investigations: daily.continueWorking.map((item) => ({
      id: item.id,
      label: item.label,
      prompt: item.prompt
    })),
    aiSuggestions: [
      {
        id: "s1",
        title: "Root Cause Candidate",
        candidate: "Bearing Wear",
        confidence: "82%",
        prompt: `Investigate ${machine} — bearing wear root cause analysis with 5 Why`
      }
    ],
    workflowSteps: [
      "Investigation",
      "Evidence",
      "Root Cause",
      "Countermeasure",
      "Report",
      "Approval",
      "Closed"
    ]
  };
}

function supervisorHome(workspaceId: string) {
  const isToyota = workspaceId === "toyota-plant";
  const machine = isToyota ? "Machine EA-04" : "Machine M-12";
  return {
    overview: [
      { label: "Production", status: "green" as const },
      { label: "Quality", status: "yellow" as const },
      { label: "Maintenance", status: "yellow" as const }
    ],
    waitingApproval: [
      { label: "Work Orders", count: 2, action: "approval-queue" },
      { label: "SOP Revision", count: 1, action: "sop-revisions" },
      { label: "Engineering Reports", count: 3, action: "engineering-reports" }
    ],
    openIssues: [
      {
        id: "oi1",
        title: machine,
        owner: "Abdul",
        status: "Investigating",
        prompt: `${machine} status and investigation progress`
      }
    ],
    teamPerformance: [
      { name: "Engineer", closed: 5, pending: 2 },
      { name: "Operator", closed: 12, pending: 1 }
    ]
  };
}

function managerHome(daily: DailyWorkspace) {
  return {
    factoryOverview: [
      { label: "Production", value: "96%", status: "green" as const },
      { label: "Quality", value: "98%", status: "green" as const },
      { label: "Delivery", value: "99%", status: "green" as const },
      { label: "Safety", value: "100%", status: "green" as const }
    ],
    criticalIssues: [
      { id: "ci1", title: "Machine M-12", prompt: "Executive summary of Machine M-12 impact on production" },
      { id: "ci2", title: "Supplier Delay", prompt: "Risk assessment for supplier delay" },
      { id: "ci3", title: "Customer Complaint", prompt: "Status of open customer quality complaints" }
    ],
    weeklyTrend: [
      { label: "Production", trend: "up" as const },
      { label: "Quality", trend: "up" as const },
      { label: "Cost", trend: "down" as const }
    ],
    executiveSummary: [
      "Production remains stable.",
      "Quality improved 4%.",
      "Supplier A requires attention."
    ]
  };
}

const personaConfig: Record<
  RoleKey,
  { label: string; chatPersona: string; suggestions: Array<{ label: string; prompt: string }> }
> = {
  operator: {
    label: "Shop Floor Assistant",
    chatPersona:
      "You are a shop floor AI assistant. Help with SOP steps, machine setup, quality checkpoints, and basic troubleshooting. Use simple, direct language. Do not discuss KPIs or management topics.",
    suggestions: [
      { label: "Show SOP Step", prompt: "Show me the SOP steps for my current task" },
      { label: "Machine Setup", prompt: "How do I set up the machine for today's run?" },
      { label: "Quality Checkpoint", prompt: "What quality checkpoints must I complete?" },
      { label: "Basic Troubleshooting", prompt: "Machine alarm — what should I check first?" }
    ]
  },
  engineer: {
    label: "Manufacturing Engineer AI",
    chatPersona:
      "You are a manufacturing engineer AI. Focus on root cause analysis, 5 Why, fishbone, similar cases, countermeasures, and technical SOP references. Provide structured investigation guidance.",
    suggestions: [
      { label: "Explain Alarm", prompt: "Explain the machine alarm and likely technical cause" },
      { label: "Generate 5 Why", prompt: "Generate a 5 Why analysis for this issue" },
      { label: "Find Similar Case", prompt: "Find similar cases from history" },
      { label: "Create Report", prompt: "Draft an engineering investigation report" }
    ]
  },
  supervisor: {
    label: "Supervisor AI",
    chatPersona:
      "You are a production supervisor AI. Focus on team progress, approvals, escalations, who owns each issue, and whether work is on track. Do not deep-dive into technical SOP unless asked.",
    suggestions: [
      { label: "Who Hasn't Submitted", prompt: "Who has not submitted their report today?" },
      { label: "Pending Approvals", prompt: "What is waiting for my approval?" },
      { label: "Issue Status", prompt: "Status of all open issues and owners" },
      { label: "Send Reminder", prompt: "Draft a reminder for pending team actions" }
    ]
  },
  manager: {
    label: "Executive AI Advisor",
    chatPersona:
      "You are an executive AI advisor for plant management. Focus on KPI impact, production targets, customer risk, trends, and business summary. Avoid operator-level SOP detail unless requested.",
    suggestions: [
      { label: "KPI Impact", prompt: "What is the KPI impact of current critical issues?" },
      { label: "Executive Summary", prompt: "Give me today's executive factory summary" },
      { label: "Risk Assessment", prompt: "Assess risks to production and delivery targets" },
      { label: "Weekly Report", prompt: "Draft weekly plant performance report" }
    ]
  }
};

export function buildRoleHome(workspaceId: string, role: string, daily: DailyWorkspace): RoleHomeData {
  const roleKey = normalizeRoleKey(role);
  const persona = personaConfig[roleKey];

  const base: RoleHomeData = {
    roleKey,
    personaLabel: persona.label,
    chatPersona: persona.chatPersona,
    copilotSuggestions: persona.suggestions
  };

  switch (roleKey) {
    case "operator":
      return { ...base, operator: operatorHome(workspaceId) };
    case "supervisor":
      return { ...base, supervisor: supervisorHome(workspaceId) };
    case "manager":
      return { ...base, manager: managerHome(daily) };
    default:
      return { ...base, engineer: engineerHome(workspaceId, daily) };
  }
}
