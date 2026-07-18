import type { DomainModule, KnowledgeSource } from "@buek/shared-types";
import {
  customDailyWorkspace,
  epsonDailyWorkspace,
  nestleDailyWorkspace,
  toyotaDailyWorkspace,
  type DailyWorkspace
} from "./daily-workspace.js";
import { buildRoleHome, normalizeRoleKey, type RoleHomeData } from "./role-workspaces.js";

export type { DailyWorkspace } from "./daily-workspace.js";
export type { RoleHomeData, RoleKey } from "./role-workspaces.js";
export { buildRoleHome, normalizeRoleKey } from "./role-workspaces.js";

export interface Workspace {
  id: string;
  companyId: string;
  name: string;
  organization: string;
  industry: string;
  domain: string;
  moduleId: string;
  description: string;
  plant: string;
  shift: string;
  knowledgeVersion: string;
  aiProvider: string;
  aiWorker: string;
  status: "knowledge-ready" | "no-knowledge";
  lastSync: string;
  dailyWorkspace: DailyWorkspace;
  factoryHealth: {
    status: "healthy" | "attention" | "critical";
    message: string;
  };
  aiGreeting: {
    intro: string;
    attentionItems: string[];
    prompt: string;
  };
  capabilities: string[];
  examplePrompts: Array<{
    icon: string;
    label: string;
    prompt: string;
  }>;
  summaryItems: Array<{
    id: string;
    category: "maintenance" | "quality" | "production";
    title: string;
    subtitle: string;
    actionLabel: string;
    prompt: string;
  }>;
  recentInvestigations: Array<{
    id: string;
    label: string;
    actionLabel: string;
    prompt: string;
  }>;
  summaryCounts: {
    maintenanceAlerts: number;
    qualityIssues: number;
  };
  factoryAreas: Array<{
    id: string;
    label: string;
    status: "green" | "yellow" | "red";
    summary: string;
    metrics?: Array<{ label: string; value: string }>;
    items?: Array<{
      id: string;
      label: string;
      issue?: string;
      history?: string[];
    }>;
  }>;
  documentStats: Array<{
    label: string;
    count: number;
  }>;
  kpis: Array<{
    label: string;
    value: string;
    status: "green" | "yellow" | "red";
  }>;
  alerts: Array<{
    severity: "warning" | "critical" | "info";
    message: string;
  }>;
  aiInsights: string[];
  quickActions: string[];
  knowledgeCollections: string[];
  knowledgeSourceIds: string[];
  similarCases: Array<{
    id: string;
    title: string;
    summary: string;
  }>;
}

export interface DemoUser {
  id: string;
  companyId: string;
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}

export const demoRoles = ["Operator", "Engineer", "Supervisor", "Plant Manager"] as const;

export type DemoRole = (typeof demoRoles)[number];

export const demoWorkspaceOptions = [
  { id: "epson-factory", label: "Epson Indonesia" },
  { id: "toyota-plant", label: "Toyota Indonesia" },
  { id: "nestle-factory", label: "Nestlé Indonesia" },
  { id: "custom-company", label: "Custom Workspace" }
] as const;

export const demoUsers: DemoUser[] = [
  {
    id: "user-epson-demo",
    companyId: "Epson Demo",
    username: "demo",
    password: "BuekDemo2026!",
    email: "abdul@epson.demo",
    name: "Abdul",
    role: "Manufacturing Engineer",
    workspaceId: "epson-factory"
  },
  {
    id: "user-toyota-demo",
    companyId: "Toyota Demo",
    username: "demo",
    password: "BuekDemo2026!",
    email: "sari@toyota.demo",
    name: "Sari",
    role: "Assembly Quality Engineer",
    workspaceId: "toyota-plant"
  },
  {
    id: "user-nestle-demo",
    companyId: "Nestle Demo",
    username: "demo",
    password: "BuekDemo2026!",
    email: "raka@nestle.demo",
    name: "Raka",
    role: "Food Safety Assistant",
    workspaceId: "nestle-factory"
  },
  {
    id: "user-custom-demo",
    companyId: "Custom Company",
    username: "demo",
    password: "BuekDemo2026!",
    email: "admin@custom.demo",
    name: "New User",
    role: "Knowledge Admin",
    workspaceId: "custom-company"
  }
];

export const workspaces: Workspace[] = [
  {
    id: "epson-factory",
    companyId: "epson-demo",
    name: "Epson Factory",
    organization: "Epson Indonesia",
    industry: "Manufacturing",
    domain: "Printer Manufacturing",
    moduleId: "manufacturing",
    description:
      "Demo workspace showing how uploaded SOP, QC, troubleshooting, escalation, and Kaizen knowledge powers an AI worker.",
    knowledgeCollections: [
      "Production SOP",
      "Quality SOP",
      "Troubleshooting Guide",
      "Escalation Rule",
      "Kaizen"
    ],
    plant: "Cikarang",
    shift: "Shift A",
    knowledgeVersion: "2026.07",
    aiProvider: "OpenAI",
    aiWorker: "Manufacturing Engineer",
    status: "knowledge-ready",
    lastSync: "Today",
    dailyWorkspace: epsonDailyWorkspace,
    factoryHealth: {
      status: "attention",
      message: "Attention needed"
    },
    aiGreeting: {
      intro: "Hi Abdul. I found 3 things that may need your attention today.",
      attentionItems: [
        "Machine 12 vibration increased.",
        "White streak defects increased.",
        "Production is currently on target."
      ],
      prompt: "What would you like to investigate?"
    },
    capabilities: [
      "Production",
      "Maintenance",
      "Quality",
      "Documents",
      "KPI",
      "Machines",
      "Work Orders"
    ],
    examplePrompts: [
      { icon: "🛠", label: "Machine 12 alarm", prompt: "Machine 12 alarm terus" },
      { icon: "📈", label: "Why did OEE drop?", prompt: "Why did OEE drop?" },
      { icon: "📄", label: "Show SOP-014", prompt: "Show SOP-014 printer white streak troubleshooting" },
      {
        icon: "⚠",
        label: "White streak investigation",
        prompt: "Continue white streak investigation"
      }
    ],
    summaryItems: [
      {
        id: "sum-m1",
        category: "maintenance",
        title: "Machine 12",
        subtitle: "Bearing vibration high",
        actionLabel: "Open",
        prompt: "Machine 12 alarm terus — show bearing vibration details"
      },
      {
        id: "sum-q1",
        category: "quality",
        title: "Quality",
        subtitle: "White streak increased",
        actionLabel: "Investigate",
        prompt: "Continue white streak investigation"
      },
      {
        id: "sum-p1",
        category: "production",
        title: "Production",
        subtitle: "On target",
        actionLabel: "View",
        prompt: "Show today's production status"
      }
    ],
    recentInvestigations: [
      {
        id: "ri-1",
        label: "Machine 12",
        actionLabel: "Continue",
        prompt: "Machine 12 alarm terus"
      },
      {
        id: "ri-2",
        label: "White Streak",
        actionLabel: "Continue",
        prompt: "Continue white streak investigation"
      },
      {
        id: "ri-3",
        label: "SOP-014",
        actionLabel: "Open",
        prompt: "Show SOP-014 printer white streak troubleshooting"
      }
    ],
    summaryCounts: {
      maintenanceAlerts: 2,
      qualityIssues: 1
    },
    factoryAreas: [
      {
        id: "production",
        label: "Production",
        status: "green",
        summary: "Running",
        metrics: [
          { label: "Output", value: "12,480" },
          { label: "Reject", value: "2.3%" },
          { label: "Target", value: "12,000" },
          { label: "Shift", value: "Shift A" },
          { label: "Operator", value: "Abdul" }
        ]
      },
      {
        id: "quality",
        label: "Quality",
        status: "yellow",
        summary: "1 Issue",
        items: [
          {
            id: "q-1",
            label: "White streak on Line 3",
            issue: "Reject increased 18% vs yesterday",
            history: ["SOP-014 opened", "4 similar cases found", "QC Standard 12 referenced"]
          }
        ]
      },
      {
        id: "maintenance",
        label: "Maintenance",
        status: "yellow",
        summary: "2 Alerts",
        items: [
          {
            id: "m-12",
            label: "Machine 12",
            issue: "Alarm repeating",
            history: ["Runtime 14h", "Last PM 3 days ago", "Bearing inspection due"]
          },
          {
            id: "m-04",
            label: "Machine M-04",
            issue: "Vibration high",
            history: ["Trend rising 2 shifts", "Sensor threshold exceeded"]
          }
        ]
      },
      {
        id: "delivery",
        label: "Delivery",
        status: "green",
        summary: "On track",
        metrics: [{ label: "OTD", value: "99.3%" }]
      }
    ],
    documentStats: [
      { label: "SOP", count: 327 },
      { label: "Work Instruction", count: 124 },
      { label: "QC Standard", count: 58 },
      { label: "Escalation Rules", count: 19 }
    ],
    kpis: [
      { label: "OEE", value: "91.8%", status: "green" },
      { label: "PPM", value: "2,850", status: "yellow" },
      { label: "Downtime", value: "15 min", status: "green" },
      { label: "Output", value: "12,480", status: "green" },
      { label: "Delivery", value: "99.3%", status: "green" }
    ],
    alerts: [
      { severity: "warning", message: "White streak increased on printer output" },
      { severity: "warning", message: "Machine M-04 vibration high" },
      { severity: "info", message: "SOP-014 revision pending approval" }
    ],
    aiInsights: [
      "Reject naik 18% dibanding kemarin.",
      "Kemungkinan berasal dari proses ink filling.",
      "Saya menemukan 4 kasus serupa dan SOP-014 relevan."
    ],
    quickActions: [
      "Production",
      "Quality",
      "Maintenance",
      "Engineering",
      "Inventory",
      "Documents",
      "AI Worker"
    ],
    knowledgeSourceIds: [
      "printer-white-streaks-sop",
      "printer-qc-standard-12",
      "why-why-white-streaks",
      "countermeasure-printhead-cleaning",
      "countermeasure-transfer-roller",
      "defect-containment-printer-output",
      "kaizen-printer-first-article",
      "printer-root-cause-matrix",
      "printer-maintenance-frequency",
      "operator-escalation-rule"
    ],
    similarCases: [
      {
        id: "sim-1",
        title: "White streak on Line 3 — Shift B",
        summary: "Clogged nozzle. Resolved after printhead cleaning per SOP-014."
      },
      {
        id: "sim-2",
        title: "White streak after consumable change",
        summary: "Test pattern failed. Replaced cartridge, 3 OK samples before release."
      },
      {
        id: "sim-3",
        title: "Machine 12 alarm — bearing wear",
        summary: "Same alarm 3 times this week. Bearing replaced, PM schedule updated."
      },
      {
        id: "sim-4",
        title: "Reject spike ink filling",
        summary: "18% increase traced to ink filling process. Kaizen KAIZEN-004 applied."
      }
    ]
  },
  {
    id: "toyota-plant",
    companyId: "toyota-demo",
    name: "Toyota Plant",
    organization: "Toyota Demo",
    industry: "Manufacturing",
    domain: "Automotive Assembly",
    moduleId: "manufacturing",
    description:
      "Demo workspace for automotive assembly knowledge: torque standards, inspection, safety, and root cause analysis.",
    plant: "Karawang",
    shift: "Shift B",
    knowledgeVersion: "2026.07",
    aiProvider: "OpenAI",
    aiWorker: "Assembly Quality Engineer",
    status: "knowledge-ready",
    lastSync: "Today",
    dailyWorkspace: toyotaDailyWorkspace,
    factoryHealth: { status: "attention", message: "Attention needed" },
    aiGreeting: {
      intro: "Hi Sari. I found 2 things that may need your attention today.",
      attentionItems: [
        "Bolt torque drift at station EA-04.",
        "Torque tool calibration due in 2 days."
      ],
      prompt: "What would you like to investigate?"
    },
    capabilities: [
      "Production",
      "Maintenance",
      "Quality",
      "Documents",
      "KPI",
      "Machines",
      "Work Orders"
    ],
    examplePrompts: [
      { icon: "🛠", label: "Torque drift EA-04", prompt: "Bolt torque out of specification at EA-04" },
      { icon: "📄", label: "Show ASM-022", prompt: "Show ASM-022 engine bolt torque standard" },
      { icon: "📈", label: "Why did OEE drop?", prompt: "Why did OEE drop on assembly line?" },
      { icon: "⚠", label: "Tool calibration", prompt: "Which torque tools need calibration this week?" }
    ],
    summaryItems: [
      {
        id: "sum-t1",
        category: "quality",
        title: "Station EA-04",
        subtitle: "Bolt torque drift",
        actionLabel: "Investigate",
        prompt: "Bolt torque out of specification at EA-04"
      },
      {
        id: "sum-t2",
        category: "maintenance",
        title: "Torque tool",
        subtitle: "Calibration due in 2 days",
        actionLabel: "Open",
        prompt: "Show torque tool calibration schedule"
      },
      {
        id: "sum-t3",
        category: "production",
        title: "Production",
        subtitle: "On target",
        actionLabel: "View",
        prompt: "Show today's assembly production status"
      }
    ],
    recentInvestigations: [
      {
        id: "ri-t1",
        label: "Torque drift EA-04",
        actionLabel: "Continue",
        prompt: "Bolt torque out of specification at EA-04"
      },
      {
        id: "ri-t2",
        label: "ASM-022",
        actionLabel: "Open",
        prompt: "Show ASM-022 engine bolt torque standard"
      }
    ],
    summaryCounts: { maintenanceAlerts: 1, qualityIssues: 1 },
    factoryAreas: [
      {
        id: "production",
        label: "Production",
        status: "green",
        summary: "Running",
        metrics: [
          { label: "Output", value: "8,930" },
          { label: "Torque OK", value: "98.9%" }
        ]
      },
      {
        id: "quality",
        label: "Quality",
        status: "yellow",
        summary: "1 Issue",
        items: [
          {
            id: "q-t1",
            label: "Station EA-04",
            issue: "Bolt torque drift",
            history: ["ASM-022 referenced", "5 similar cases in last week"]
          }
        ]
      },
      {
        id: "maintenance",
        label: "Maintenance",
        status: "yellow",
        summary: "1 Alert",
        items: [
          {
            id: "m-t1",
            label: "Torque tool calibration",
            issue: "Due in 2 days",
            history: ["Tool ID TQ-07", "Last calibration 28 days ago"]
          }
        ]
      },
      { id: "delivery", label: "Delivery", status: "green", summary: "On track" }
    ],
    documentStats: [
      { label: "Assembly SOP", count: 412 },
      { label: "Torque Standard", count: 88 },
      { label: "Inspection Standard", count: 73 },
      { label: "Safety Rules", count: 42 }
    ],
    kpis: [
      { label: "OEE", value: "94.2%", status: "green" },
      { label: "PPM", value: "1,420", status: "green" },
      { label: "Downtime", value: "22 min", status: "yellow" },
      { label: "Output", value: "8,930", status: "green" },
      { label: "Torque OK", value: "98.9%", status: "green" }
    ],
    alerts: [
      { severity: "warning", message: "Bolt torque drift at station EA-04" },
      { severity: "info", message: "Tool calibration due in 2 days" }
    ],
    aiInsights: [
      "Torque deviation appears concentrated at station EA-04.",
      "ASM-022 and QC-TORQUE-07 are likely relevant.",
      "Review last 5 similar assembly cases before release."
    ],
    quickActions: ["Production", "Quality", "Maintenance", "Engineering", "Documents", "AI Worker"],
    knowledgeCollections: [
      "Assembly SOP",
      "Torque Standard",
      "Engine Inspection",
      "5 Why",
      "Safety"
    ],
    knowledgeSourceIds: ["toyota-engine-torque-standard", "operator-escalation-rule"],
    similarCases: [
      {
        id: "sim-t1",
        title: "Torque drift EA-04 — last week",
        summary: "Tool recalibration resolved drift. ASM-022 followed."
      },
      {
        id: "sim-t2",
        title: "Bolt torque out of spec — housing",
        summary: "Cross-threading found. Bolt replaced, sequence repeated."
      }
    ]
  },
  {
    id: "nestle-factory",
    companyId: "nestle-demo",
    name: "Nestle Factory",
    organization: "Nestle Demo",
    industry: "Manufacturing",
    domain: "Food Packaging",
    moduleId: "manufacturing",
    description:
      "Demo workspace for food safety and packaging operations using HACCP, cleaning, and packaging SOP knowledge.",
    plant: "Pasuruan",
    shift: "Shift A",
    knowledgeVersion: "2026.07",
    aiProvider: "OpenAI",
    aiWorker: "Food Safety Assistant",
    status: "knowledge-ready",
    lastSync: "Today",
    dailyWorkspace: nestleDailyWorkspace,
    factoryHealth: { status: "attention", message: "Attention needed" },
    aiGreeting: {
      intro: "Hi Raka. I found 2 things that may need your attention today.",
      attentionItems: [
        "Packaging contamination near seal area on Line P-03.",
        "Cleaning verification pending for Line P-03."
      ],
      prompt: "What would you like to investigate?"
    },
    capabilities: [
      "Production",
      "Maintenance",
      "Quality",
      "Documents",
      "KPI",
      "Machines",
      "Work Orders"
    ],
    examplePrompts: [
      {
        icon: "⚠",
        label: "Packaging contamination",
        prompt: "Packaging contamination near seal area"
      },
      { icon: "📄", label: "Show HACCP-011", prompt: "Show HACCP-011 packaging contamination response" },
      { icon: "🛠", label: "Line P-03 status", prompt: "What is the current status of Line P-03?" },
      { icon: "📈", label: "Why is OEE down?", prompt: "Why is OEE down on packaging line?" }
    ],
    summaryItems: [
      {
        id: "sum-n1",
        category: "quality",
        title: "Line P-03",
        subtitle: "Packaging contamination detected",
        actionLabel: "Investigate",
        prompt: "Packaging contamination near seal area"
      },
      {
        id: "sum-n2",
        category: "maintenance",
        title: "Line P-03",
        subtitle: "Cleaning verification pending",
        actionLabel: "Open",
        prompt: "Show cleaning verification status for Line P-03"
      },
      {
        id: "sum-n3",
        category: "production",
        title: "Production",
        subtitle: "Line held — review required",
        actionLabel: "View",
        prompt: "Show packaging line production status"
      }
    ],
    recentInvestigations: [
      {
        id: "ri-n1",
        label: "Packaging contamination",
        actionLabel: "Continue",
        prompt: "Packaging contamination near seal area"
      },
      {
        id: "ri-n2",
        label: "HACCP-011",
        actionLabel: "Open",
        prompt: "Show HACCP-011 packaging contamination response"
      }
    ],
    summaryCounts: { maintenanceAlerts: 1, qualityIssues: 1 },
    factoryAreas: [
      { id: "production", label: "Production", status: "yellow", summary: "Line P-03 held" },
      {
        id: "quality",
        label: "Quality",
        status: "red",
        summary: "1 Critical",
        items: [
          {
            id: "q-n1",
            label: "Line P-03 seal area",
            issue: "Packaging contamination detected",
            history: ["HACCP-011 triggered", "Supplier lot held", "QA review pending"]
          }
        ]
      },
      {
        id: "maintenance",
        label: "Maintenance",
        status: "yellow",
        summary: "1 Alert",
        items: [
          {
            id: "m-n1",
            label: "Line P-03",
            issue: "Cleaning verification pending",
            history: ["Sanitation record incomplete", "Pre-op inspection overdue"]
          }
        ]
      },
      { id: "delivery", label: "Delivery", status: "green", summary: "On track" }
    ],
    documentStats: [
      { label: "HACCP", count: 64 },
      { label: "Cleaning SOP", count: 91 },
      { label: "Packaging SOP", count: 117 },
      { label: "QC Standard", count: 46 }
    ],
    kpis: [
      { label: "OEE", value: "89.6%", status: "yellow" },
      { label: "Complaints", value: "2", status: "green" },
      { label: "Downtime", value: "31 min", status: "yellow" },
      { label: "Output", value: "21,300", status: "green" },
      { label: "HACCP", value: "OK", status: "green" }
    ],
    alerts: [
      { severity: "critical", message: "Packaging contamination detected near seal area" },
      { severity: "warning", message: "Cleaning verification pending for Line P-03" }
    ],
    aiInsights: [
      "Contamination finding should be treated as Major until QA confirms scope.",
      "HACCP-011 and Cleaning SOP CLN-004 are likely relevant.",
      "Hold supplier packaging lot before release."
    ],
    quickActions: ["Production", "Quality", "Maintenance", "Documents", "AI Worker"],
    knowledgeCollections: ["Food Safety", "Packaging", "HACCP", "Cleaning SOP"],
    knowledgeSourceIds: ["nestle-packaging-contamination", "operator-escalation-rule"],
    similarCases: [
      {
        id: "sim-n1",
        title: "Seal area contamination — Line P-02",
        summary: "Supplier lot held. HACCP-011 containment applied."
      },
      {
        id: "sim-n2",
        title: "Foreign particle on packaging roll",
        summary: "Roll replaced after sanitation verification."
      }
    ]
  },
  {
    id: "custom-company",
    companyId: "custom-demo",
    name: "Custom Company",
    organization: "New Customer",
    industry: "Manufacturing",
    domain: "Custom Manufacturing",
    moduleId: "manufacturing",
    description:
      "Empty onboarding workspace showing how a new customer starts by uploading SOP, work instruction, and QC documents.",
    plant: "Not configured",
    shift: "Not configured",
    knowledgeVersion: "Draft",
    aiProvider: "OpenAI",
    aiWorker: "Not ready",
    status: "no-knowledge",
    lastSync: "Never",
    dailyWorkspace: customDailyWorkspace,
    factoryHealth: { status: "attention", message: "No knowledge uploaded" },
    aiGreeting: {
      intro: "Hi. This workspace is not ready yet.",
      attentionItems: ["Upload SOP to activate the AI worker for this workspace."],
      prompt: "What would you like to set up first?"
    },
    capabilities: ["Documents", "SOP", "Work Instructions", "QC Standards"],
    examplePrompts: [
      { icon: "📄", label: "Upload SOP", prompt: "How do I upload SOP documents?" },
      { icon: "📄", label: "Activate AI worker", prompt: "What do I need to activate the AI worker?" }
    ],
    summaryItems: [],
    recentInvestigations: [],
    summaryCounts: { maintenanceAlerts: 0, qualityIssues: 0 },
    factoryAreas: [],
    documentStats: [
      { label: "SOP", count: 0 },
      { label: "Work Instruction", count: 0 },
      { label: "QC Standard", count: 0 },
      { label: "Escalation Rules", count: 0 }
    ],
    kpis: [
      { label: "OEE", value: "-", status: "yellow" },
      { label: "PPM", value: "-", status: "yellow" },
      { label: "Downtime", value: "-", status: "yellow" },
      { label: "Output", value: "-", status: "yellow" },
      { label: "Knowledge", value: "0 docs", status: "red" }
    ],
    alerts: [
      { severity: "info", message: "No knowledge uploaded. Upload SOP to enable AI Worker." }
    ],
    aiInsights: [
      "This workspace is not ready yet.",
      "Upload SOP, Work Instruction, and QC Standard to activate the AI worker."
    ],
    quickActions: ["Upload SOP", "Upload Work Instruction", "Upload QC Standard", "Settings"],
    knowledgeCollections: ["No Knowledge Uploaded"],
    knowledgeSourceIds: [],
    similarCases: []
  }
];

export function getDefaultWorkspace(): Workspace {
  return workspaces[0]!;
}

export function findWorkspace(workspaceId?: string): Workspace {
  return workspaces.find((workspace) => workspace.id === workspaceId) ?? getDefaultWorkspace();
}

export function authenticateDemoUser(
  companyId: string,
  username: string,
  password: string
): { user: Omit<DemoUser, "password">; workspace: Workspace; roleHome: RoleHomeData } | undefined {
  const user = demoUsers.find(
    (candidate) =>
      candidate.companyId.toLowerCase() === companyId.trim().toLowerCase() &&
      candidate.username.toLowerCase() === username.trim().toLowerCase() &&
      candidate.password === password
  );

  if (!user) {
    return undefined;
  }

  return buildAuthResult(user);
}

export function authenticateProductionUser(
  email: string,
  password: string
): { user: Omit<DemoUser, "password">; workspace: Workspace; roleHome: RoleHomeData } | undefined {
  const user = demoUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password
  );

  if (!user) {
    return undefined;
  }

  return buildAuthResult(user);
}

const roleDisplayNames: Record<string, string> = {
  operator: "Budi",
  engineer: "Abdul",
  supervisor: "Sari",
  manager: "Raka"
};

function displayNameForRole(role: string, fallback: string): string {
  return roleDisplayNames[normalizeRoleKey(role)] ?? fallback;
}

export function launchDemoWorkspace(
  workspaceId: string,
  role: string
): { user: Omit<DemoUser, "password">; workspace: Workspace; roleHome: RoleHomeData } | undefined {
  const workspace = workspaces.find((candidate) => candidate.id === workspaceId);
  if (!workspace) {
    return undefined;
  }

  const user = demoUsers.find((candidate) => candidate.workspaceId === workspaceId) ?? demoUsers[0];
  if (!user) {
    return undefined;
  }

  const selectedRole = role.trim() || user.role;
  return buildAuthResult({
    ...user,
    role: selectedRole,
    name: displayNameForRole(selectedRole, user.name)
  });
}

function buildAuthResult(user: DemoUser): {
  user: Omit<DemoUser, "password">;
  workspace: Workspace;
  roleHome: RoleHomeData;
} {
  const { password: _password, ...safeUser } = user;
  const workspace = findWorkspace(user.workspaceId);
  const roleHome = buildRoleHome(workspace.id, user.role, workspace.dailyWorkspace);

  return {
    user: safeUser,
    workspace,
    roleHome
  };
}

export function findWorkspaceModule(workspace: Workspace, modules: DomainModule[]): DomainModule {
  const module = modules.find((candidate) => candidate.id === workspace.moduleId);

  if (!module) {
    throw new Error(`Workspace module "${workspace.moduleId}" is not installed.`);
  }

  if (!workspace.knowledgeSourceIds.length) {
    return { ...module, knowledge: [] };
  }

  return {
    ...module,
    knowledge: module.knowledge.filter((source) => workspace.knowledgeSourceIds.includes(source.id))
  };
}

export function buildWorkspaceKnowledgeContext(
  workspace: Workspace,
  knowledge: KnowledgeSource[]
): string {
  return [
    workspace.name,
    workspace.organization,
    workspace.industry,
    workspace.domain,
    workspace.knowledgeCollections.join(" "),
    knowledge
      .map((source) =>
        [
          source.title,
          source.summary,
          source.tags.join(" "),
          source.referenceId ?? "",
          source.content ?? ""
        ].join(" ")
      )
      .join(" ")
  ].join(" ");
}
