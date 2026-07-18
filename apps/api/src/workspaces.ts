import type { DomainModule, KnowledgeSource } from "@buek/shared-types";

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
}

export interface DemoUser {
  id: string;
  companyId: string;
  username: string;
  password: string;
  name: string;
  role: string;
  workspaceId: string;
}

export const demoUsers: DemoUser[] = [
  {
    id: "user-epson-demo",
    companyId: "Epson Demo",
    username: "demo",
    password: "demo123",
    name: "Abdul",
    role: "Manufacturing Engineer",
    workspaceId: "epson-factory"
  },
  {
    id: "user-toyota-demo",
    companyId: "Toyota Demo",
    username: "demo",
    password: "demo123",
    name: "Sari",
    role: "Assembly Quality Engineer",
    workspaceId: "toyota-plant"
  },
  {
    id: "user-nestle-demo",
    companyId: "Nestle Demo",
    username: "demo",
    password: "demo123",
    name: "Raka",
    role: "Food Safety Assistant",
    workspaceId: "nestle-factory"
  },
  {
    id: "user-custom-demo",
    companyId: "Custom Company",
    username: "demo",
    password: "demo123",
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
    organization: "Epson Demo Plant",
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
    knowledgeSourceIds: ["toyota-engine-torque-standard", "operator-escalation-rule"]
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
    knowledgeSourceIds: ["nestle-packaging-contamination", "operator-escalation-rule"]
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
    knowledgeSourceIds: []
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
): { user: Omit<DemoUser, "password">; workspace: Workspace } | undefined {
  const user = demoUsers.find(
    (candidate) =>
      candidate.companyId.toLowerCase() === companyId.trim().toLowerCase() &&
      candidate.username.toLowerCase() === username.trim().toLowerCase() &&
      candidate.password === password
  );

  if (!user) {
    return undefined;
  }

  const { password: _password, ...safeUser } = user;

  return {
    user: safeUser,
    workspace: findWorkspace(user.workspaceId)
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
