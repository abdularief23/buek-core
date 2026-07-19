import type { DailyWorkspace } from "./daily-workspace.js";
import { getTenantThemeOrDefault } from "./tenants/index.js";

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
    investigations: Array<{ id: string; label: string; prompt?: string; issueKey?: string }>;
    aiSuggestions: Array<{
      id: string;
      title: string;
      candidate: string;
      confidence: string;
      prompt: string;
      issueKey?: string;
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
      prompt?: string;
      issueKey?: string;
    }>;
    teamPerformance: Array<{ name: string; closed: number; pending: number }>;
  };
  manager?: {
    factoryOverview: Array<{ label: string; value: string; status: "green" | "yellow" | "red" }>;
    todayFocus?: Array<{
      id: string;
      label: string;
      count?: number;
      badge?: string;
      route: "customer-complaints" | "production-dashboard" | "kpi-detail";
      kpiLabel?: string;
    }>;
    criticalIssues: Array<{
      id: string;
      title: string;
      prompt?: string;
      route?: "customer-complaint" | "investigation" | "production-dashboard";
      complaintId?: string;
      issueKey?: string;
    }>;
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
  const tenant = getTenantThemeOrDefault(workspaceId);

  if (workspaceId === "toyota-plant") {
    return {
      line: tenant.lineLabel,
      shift: "Shift B",
      targetOutput: 380,
      progress: 142,
      checklist: [
        { id: "c1", label: "Torque Check EA-04", done: false },
        { id: "c2", label: "Engine Mount Verification", done: true },
        { id: "c3", label: "Body Welding Visual", done: false },
        { id: "c4", label: "Chassis Assembly Sign-off", done: false }
      ],
      qualityReminders: ["Verify torque sequence per ASM-022", "Do not skip VIN checkpoint"]
    };
  }

  if (workspaceId === "nestle-factory") {
    return {
      line: tenant.lineLabel,
      shift: "Shift A",
      targetOutput: 520,
      progress: 198,
      checklist: [
        { id: "c1", label: "CCP Temperature Check", done: true },
        { id: "c2", label: "Metal Detector Test", done: false },
        { id: "c3", label: "Packaging Seal Inspection", done: false },
        { id: "c4", label: "Cleaning Verification", done: false }
      ],
      qualityReminders: ["Follow HACCP-011 for any alarm", "Record batch number on every CCP check"]
    };
  }

  return {
    line: tenant.lineLabel,
    shift: "Shift A",
    targetOutput: 420,
    progress: 165,
    checklist: [
      { id: "c1", label: "Print Head Inspection", done: true },
      { id: "c2", label: "Ink Level Check", done: false },
      { id: "c3", label: "White Streak Sample", done: false },
      { id: "c4", label: "PPM Verification", done: false }
    ],
    qualityReminders: ["Use SOP-014 Rev.5 for white streak", "Check ink lot before run"]
  };
}

function engineerHome(workspaceId: string, daily: DailyWorkspace) {
  const tenant = getTenantThemeOrDefault(workspaceId);
  const primary = tenant.primaryIssue;
  const secondary = tenant.secondaryIssue;

  if (workspaceId === "toyota-plant") {
    return {
      problems: [
        {
          id: "p1",
          severity: "critical" as const,
          icon: "🔴",
          title: primary.title,
          detail: "Torque out of spec at EA-04",
          actionLabel: "Lanjutkan Analisa",
          prompt: "Bolt torque out of specification at EA-04 — technical investigation",
          contextLabel: "Station EA-04",
          action: "investigation",
          issueKey: primary.key
        },
        {
          id: "p2",
          severity: "warning" as const,
          icon: "🟠",
          title: secondary.title,
          detail: "3 units waiting at chassis line",
          actionLabel: "Review",
          prompt: "Engine inspection backlog status and impact",
          contextLabel: "Engine Inspection",
          action: "investigation",
          issueKey: secondary.key
        },
        {
          id: "p3",
          severity: "attention" as const,
          icon: "🟢",
          title: "Body Welding normal",
          detail: "All welding stations within tolerance",
          actionLabel: "View",
          prompt: "Show body welding station status",
          contextLabel: "Body Welding"
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
          title: "Possible Cause",
          candidate: "Torque Tool Drift",
          confidence: "84%",
          prompt: "Investigate EA-04 torque drift — 5 Why analysis with ASM-022"
        }
      ],
      workflowSteps: [
        "Problem Created",
        "Collect Evidence",
        "Similar Cases",
        "Review SOP",
        "Possible Cause",
        "Engineer Decision",
        "Countermeasure",
        "Execution Plan",
        "Verification",
        "Technical Report",
        "Approval",
        "Lessons Learned"
      ]
    };
  }

  if (workspaceId === "nestle-factory") {
    return {
      problems: [
        {
          id: "p1",
          severity: "critical" as const,
          icon: "🔴",
          title: primary.title,
          detail: "Alarm on packaging line P-03",
          actionLabel: "Lanjutkan Analisa",
          prompt: "Metal detector alarm on Line P-03 — HACCP response",
          contextLabel: "Line P-03",
          action: "investigation",
          issueKey: primary.key
        },
        {
          id: "p2",
          severity: "warning" as const,
          icon: "🟠",
          title: secondary.title,
          detail: "Line held pending QA review",
          actionLabel: "Review",
          prompt: "Packaging line P-03 stop — investigation and containment",
          contextLabel: "Packaging",
          action: "investigation",
          issueKey: secondary.key
        },
        {
          id: "p3",
          severity: "attention" as const,
          icon: "🟢",
          title: "CCP Check completed",
          detail: "All critical control points verified",
          actionLabel: "View",
          prompt: "Show CCP check results for today",
          contextLabel: "CCP"
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
          title: "Possible Cause",
          candidate: "Supplier Packaging Lot",
          confidence: "76%",
          prompt: "Investigate metal detector alarm — HACCP-011 containment steps"
        }
      ],
      workflowSteps: [
        "Problem Created",
        "Collect Evidence",
        "Similar Cases",
        "Review SOP",
        "Possible Cause",
        "Engineer Decision",
        "Countermeasure",
        "Execution Plan",
        "Verification",
        "Technical Report",
        "Approval",
        "Lessons Learned"
      ]
    };
  }

  return {
    problems: [
      {
        id: "p1",
        severity: "critical" as const,
        icon: "🔴",
        title: `${primary.title} +12%`,
        detail: "Compared with yesterday",
        actionLabel: "Investigate",
        prompt: "Continue white streak investigation — possible cause analysis",
        contextLabel: "White Streak",
        action: "investigation",
        issueKey: primary.key
      },
      {
        id: "p2",
        severity: "warning" as const,
        icon: "🟠",
        title: secondary.title,
        detail: "18% above target on Line 2",
        actionLabel: "Review",
        prompt: "Why is ink consumption high on Line 2?",
        contextLabel: "Ink",
        action: "investigation",
        issueKey: secondary.key
      },
      {
        id: "p3",
        severity: "attention" as const,
        icon: "🟢",
        title: `${tenant.lineLabel} berjalan normal`,
        detail: "Print head and assembly within spec",
        actionLabel: "View",
        prompt: "Show printer assembly line status",
        contextLabel: tenant.lineLabel
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
        title: "Possible Cause",
        candidate: "Print Head Nozzle",
        confidence: "82%",
        prompt: "Investigate white streak — print head and ink filling 5 Why"
      }
    ],
    workflowSteps: [
      "Problem Created",
      "Collect Evidence",
      "Similar Cases",
      "Review SOP",
      "Possible Cause",
      "Engineer Decision",
      "Countermeasure",
      "Execution Plan",
      "Verification",
      "Technical Report",
      "Approval",
      "Lessons Learned"
    ]
  };
}

function supervisorHome(workspaceId: string) {
  const tenant = getTenantThemeOrDefault(workspaceId);

  if (workspaceId === "toyota-plant") {
    return {
      overview: [
        { label: "Production", status: "green" as const },
        { label: "Quality", status: "yellow" as const },
        { label: "Maintenance", status: "yellow" as const }
      ],
      waitingApproval: [
        { label: "Work Orders", count: 2, action: "approval-queue" },
        { label: "ASM Revisions", count: 1, action: "sop-revisions" },
        { label: "Engineering Reports", count: 2, action: "engineering-reports" }
      ],
      openIssues: [
        {
          id: "oi1",
          title: "Torque Station EA-04",
          owner: "Sari",
          status: "Investigating",
          prompt: "Torque station EA-04 status and investigation progress",
          issueKey: "torque-drift"
        },
        {
          id: "oi2",
          title: "Engine Inspection Backlog",
          owner: "Abdul",
          status: "Open",
          prompt: "Engine inspection backlog status",
          issueKey: "engine-inspection"
        }
      ],
      teamPerformance: [
        { name: "Engineer", closed: 5, pending: 2 },
        { name: "Operator", closed: 11, pending: 1 }
      ]
    };
  }

  if (workspaceId === "nestle-factory") {
    return {
      overview: [
        { label: "Production", status: "yellow" as const },
        { label: "Food Safety", status: "red" as const },
        { label: "Compliance", status: "green" as const }
      ],
      waitingApproval: [
        { label: "HACCP Actions", count: 2, action: "approval-queue" },
        { label: "SOP Revisions", count: 1, action: "sop-revisions" },
        { label: "QA Reports", count: 2, action: "engineering-reports" }
      ],
      openIssues: [
        {
          id: "oi1",
          title: "Metal Detector Alarm P-03",
          owner: "Budi",
          status: "Investigating",
          prompt: "Metal detector alarm Line P-03 status",
          issueKey: "metal-detector"
        },
        {
          id: "oi2",
          title: "Packaging Line Stop",
          owner: "Raka",
          status: "Held",
          prompt: "Packaging line P-03 hold status and release criteria",
          issueKey: "packaging-stop"
        }
      ],
      teamPerformance: [
        { name: "QA", closed: 4, pending: 3 },
        { name: "Operator", closed: 9, pending: 2 }
      ]
    };
  }

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
        title: `White Streak — ${tenant.lineLabel}`,
        owner: "Abdul",
        status: "Investigating",
        prompt: "White streak investigation progress on printer line",
        issueKey: tenant.primaryIssueKey
      },
      {
        id: "oi2",
        title: "Ink Consumption High",
        owner: "Sari",
        status: "Open",
        prompt: "Ink consumption trend on Line 2",
        issueKey: "ink-consumption"
      }
    ],
    teamPerformance: [
      { name: "Engineer", closed: 5, pending: 2 },
      { name: "Operator", closed: 12, pending: 1 }
    ]
  };
}

function managerHome(workspaceId: string, daily: DailyWorkspace) {
  const tenant = getTenantThemeOrDefault(workspaceId);

  if (workspaceId === "toyota-plant") {
    return {
      factoryOverview: [
        { label: "Production", value: "94%", status: "green" as const },
        { label: "Torque OK", value: "98.9%", status: "green" as const },
        { label: "Delivery", value: "99%", status: "green" as const },
        { label: "Safety", value: "100%", status: "green" as const }
      ],
      criticalIssues: [
        {
          id: "ci1",
          title: "Torque Station EA-04 Failed",
          prompt: "Executive summary of torque failure at EA-04"
        },
        {
          id: "ci2",
          title: "Engine Inspection Delayed",
          prompt: "Impact of engine inspection backlog on delivery"
        },
        { id: "ci3", title: "Welding Rework Trend", prompt: "Weekly welding rework trend analysis" }
      ],
      weeklyTrend: [
        { label: "Production", trend: "up" as const },
        { label: "Torque OK", trend: "down" as const },
        { label: "Cost", trend: "flat" as const }
      ],
      executiveSummary: daily.aiSuggestions.map((s) => s.text).slice(0, 3)
    };
  }

  if (workspaceId === "nestle-factory") {
    return {
      factoryOverview: [
        { label: "Production", value: "87%", status: "yellow" as const },
        { label: "HACCP", value: "Alert", status: "red" as const },
        { label: "CCP", value: "OK", status: "green" as const },
        { label: "Compliance", value: "100%", status: "green" as const }
      ],
      criticalIssues: [
        {
          id: "ci1",
          title: "Metal Detector Alarm",
          prompt: "Executive summary of metal detector alarm on P-03"
        },
        {
          id: "ci2",
          title: "Packaging Line Stopped",
          prompt: "Business impact of packaging line hold"
        },
        { id: "ci3", title: "Batch Hold — Supplier Lot", prompt: "Status of held supplier packaging lot" }
      ],
      weeklyTrend: [
        { label: "Production", trend: "down" as const },
        { label: "Food Safety", trend: "down" as const },
        { label: "Complaints", trend: "flat" as const }
      ],
      executiveSummary: daily.aiSuggestions.map((s) => s.text).slice(0, 3)
    };
  }

  return {
    factoryOverview: [
      { label: "Production", value: "96%", status: "green" as const },
      { label: "PPM", value: "2,850", status: "yellow" as const },
      { label: "Delivery", value: "99%", status: "green" as const },
      { label: "Quality", value: "98%", status: "green" as const }
    ],
    criticalIssues: [
      {
        id: "ci1",
        title: "White Streak +12%",
        prompt: "Executive summary of white streak impact on printer output"
      },
      {
        id: "ci2",
        title: "Ink Consumption High",
        prompt: "Cost impact of elevated ink consumption"
      },
      { id: "ci3", title: `${tenant.lineLabel} Performance`, prompt: `Production summary for ${tenant.lineLabel}` }
    ],
    weeklyTrend: [
      { label: "Production", trend: "up" as const },
      { label: "PPM", trend: "up" as const },
      { label: "Cost", trend: "down" as const }
    ],
    executiveSummary: daily.aiSuggestions.map((s) => s.text).slice(0, 3)
  };
}

function personaConfig(
  workspaceId: string,
  roleKey: RoleKey
): { label: string; chatPersona: string; suggestions: Array<{ label: string; prompt: string }> } {
  const tenant = getTenantThemeOrDefault(workspaceId);
  const domainFocus = tenant.domainTerms.join(", ");

  const rolePersonas: Record<RoleKey, { label: string; focus: string; suggestions: Array<{ label: string; prompt: string }> }> = {
    operator: {
      label: `${tenant.industry} Floor Assistant`,
      focus: `Bantu operator dengan SOP, checklist, dan troubleshooting dasar terkait ${domainFocus}.`,
      suggestions: [
        { label: "Show SOP Step", prompt: `Show me the SOP steps for my current ${tenant.industry} task` },
        { label: "Machine Setup", prompt: "How do I set up the machine for today's run?" },
        { label: "Quality Checkpoint", prompt: "What quality checkpoints must I complete?" },
        { label: "Basic Troubleshooting", prompt: "Mesin bermasalah — apa yang harus saya periksa dulu?" }
      ]
    },
    engineer: {
      label: `${tenant.industry} Engineer AI`,
      focus: `Fokus pada investigasi teknis, possible cause analysis, dan referensi SOP untuk ${domainFocus}. AI tidak menentukan root cause — engineer memilih.`,
      suggestions: [
        { label: "Explain Alarm", prompt: `Explain the current alarm related to ${domainFocus}` },
        { label: "Generate 5 Why", prompt: "Generate a 5 Why analysis for this issue" },
        { label: "Find Similar Case", prompt: "Find similar cases from history" },
        { label: "Create Report", prompt: "Draft an engineering investigation report" }
      ]
    },
    supervisor: {
      label: `${tenant.industry} Supervisor AI`,
      focus: `Fokus pada progress tim, approval, eskalasi, dan ownership issue di area ${domainFocus}.`,
      suggestions: [
        { label: "Pending Approvals", prompt: "What is waiting for my approval?" },
        { label: "Issue Status", prompt: "Status of all open issues and owners" },
        { label: "Team Progress", prompt: "How is the team progressing today?" },
        { label: "Send Reminder", prompt: "Draft a reminder for pending team actions" }
      ]
    },
    manager: {
      label: `${tenant.industry} Executive AI`,
      focus: `Fokus pada KPI, risiko bisnis, dan ringkasan eksekutif untuk operasi ${tenant.industry}.`,
      suggestions: [
        { label: "KPI Impact", prompt: "What is the KPI impact of current critical issues?" },
        { label: "Executive Summary", prompt: "Give me today's executive factory summary" },
        { label: "Risk Assessment", prompt: "Assess risks to production and delivery targets" },
        { label: "Weekly Report", prompt: "Draft weekly plant performance report" }
      ]
    }
  };

  const role = rolePersonas[roleKey];
  return {
    label: role.label,
    chatPersona: `${tenant.aiPersonaIntro} ${role.focus} Jika user bertanya "mesin bermasalah", tanyakan klarifikasi: ${tenant.aiClarifyingQuestions.join(" ")}`,
    suggestions: role.suggestions
  };
}

export function buildRoleHome(workspaceId: string, role: string, daily: DailyWorkspace): RoleHomeData {
  const roleKey = normalizeRoleKey(role);
  const persona = personaConfig(workspaceId, roleKey);

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
      return { ...base, manager: managerHome(workspaceId, daily) };
    default:
      return { ...base, engineer: engineerHome(workspaceId, daily) };
  }
}
