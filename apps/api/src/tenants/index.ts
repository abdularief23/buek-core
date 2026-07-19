export interface TenantIssueSeed {
  key: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  status: "open" | "investigating" | "resolved";
  progress: number;
}

export interface TenantTheme {
  id: string;
  label: string;
  emoji: string;
  industry: string;
  industryLabel: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentMuted: string;
  ring: string;
  gradient: string;
  sopCount: number;
  modules: string[];
  knowledgeTopics: string[];
  domainTerms: string[];
  aiPersonaIntro: string;
  aiClarifyingQuestions: string[];
  defaultUserName: string;
  flagshipIssueKeys: string[];
  primaryIssueKey: string;
  machineCode: string;
  lineLabel: string;
  productionTarget: number;
  reportTitle: string;
  primaryIssue: TenantIssueSeed;
  secondaryIssue: TenantIssueSeed;
}

export type TenantThemePayload = Pick<
  TenantTheme,
  | "id"
  | "label"
  | "emoji"
  | "industry"
  | "industryLabel"
  | "primary"
  | "primaryLight"
  | "accent"
  | "accentMuted"
  | "ring"
  | "gradient"
  | "sopCount"
  | "modules"
  | "knowledgeTopics"
  | "defaultUserName"
  | "primaryIssueKey"
>;

export function toTenantThemePayload(theme: TenantTheme): TenantThemePayload {
  return {
    id: theme.id,
    label: theme.label,
    emoji: theme.emoji,
    industry: theme.industry,
    industryLabel: theme.industryLabel,
    primary: theme.primary,
    primaryLight: theme.primaryLight,
    accent: theme.accent,
    accentMuted: theme.accentMuted,
    ring: theme.ring,
    gradient: theme.gradient,
    sopCount: theme.sopCount,
    modules: theme.modules,
    knowledgeTopics: theme.knowledgeTopics,
    defaultUserName: theme.defaultUserName,
    primaryIssueKey: theme.primaryIssueKey
  };
}

export const tenantThemes: Record<string, TenantTheme> = {
  "epson-factory": {
    id: "epson-factory",
    label: "Epson Indonesia",
    emoji: "🏭",
    industry: "Printer Manufacturing",
    industryLabel: "Manufacturing Printer",
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    accent: "#60a5fa",
    accentMuted: "rgba(37, 99, 235, 0.15)",
    ring: "rgba(37, 99, 235, 0.4)",
    gradient: "from-blue-600/20 to-blue-900/10",
    sopCount: 532,
    modules: ["Manufacturing", "Quality", "Maintenance"],
    knowledgeTopics: ["Print Head", "Ink", "White Streak", "PPM", "Printer Assembly", "SOP Printer"],
    domainTerms: ["Print Head", "Ink", "PPM", "White Streak", "Printer Assembly"],
    aiPersonaIntro:
      "Anda adalah AI Printer Manufacturing Assistant untuk Epson Indonesia. Dukung SOP, KPI, PPM, OEE, quality, maintenance, engineering report, dan work order di domain manufacturing.",
    aiClarifyingQuestions: ["Print Head?", "Ink?", "White Streak?", "Printer Assembly?"],
    defaultUserName: "Abdul",
    flagshipIssueKeys: ["white-streak", "ink-consumption"],
    primaryIssueKey: "white-streak",
    machineCode: "M-312",
    lineLabel: "Line 2",
    productionTarget: 12000,
    reportTitle: "INVESTIGATION REPORT — PRINTER MANUFACTURING",
    primaryIssue: {
      key: "white-streak",
      title: "White Streak Defect",
      description: "White streak defect rate increased 12% compared to yesterday.",
      severity: "high",
      status: "investigating",
      progress: 65
    },
    secondaryIssue: {
      key: "ink-consumption",
      title: "Ink Consumption High",
      description: "Ink consumption 18% above target on Line 2.",
      severity: "medium",
      status: "open",
      progress: 30
    }
  },
  "toyota-plant": {
    id: "toyota-plant",
    label: "Toyota Indonesia",
    emoji: "🚗",
    industry: "Automotive",
    industryLabel: "Automotive Manufacturing",
    primary: "#dc2626",
    primaryLight: "#ef4444",
    accent: "#f87171",
    accentMuted: "rgba(220, 38, 38, 0.15)",
    ring: "rgba(220, 38, 38, 0.4)",
    gradient: "from-red-600/20 to-red-900/10",
    sopCount: 861,
    modules: ["Manufacturing", "Quality", "Maintenance", "Logistics"],
    knowledgeTopics: ["Torque", "Welding", "Engine", "Chassis", "Assembly Car", "VIN"],
    domainTerms: ["Torque", "Engine", "Chassis", "Welding", "VIN", "EA-04"],
    aiPersonaIntro:
      "Anda adalah AI Manufacturing Assistant untuk Toyota Indonesia. Dukung SOP, KPI, torque, welding, quality, maintenance, engineering report, dan work order.",
    aiClarifyingQuestions: ["Engine?", "Torque?", "Welding?", "Chassis?"],
    defaultUserName: "Sari",
    flagshipIssueKeys: ["torque-drift", "engine-inspection"],
    primaryIssueKey: "torque-drift",
    machineCode: "EA-04",
    lineLabel: "EA Line",
    productionTarget: 8900,
    reportTitle: "QUALITY INVESTIGATION REPORT — AUTOMOTIVE",
    primaryIssue: {
      key: "torque-drift",
      title: "Torque Station EA-04 Failed",
      description: "Bolt torque out of specification at station EA-04.",
      severity: "critical",
      status: "investigating",
      progress: 55
    },
    secondaryIssue: {
      key: "engine-inspection",
      title: "Engine Inspection Delayed",
      description: "Engine inspection backlog — 3 units waiting at chassis line.",
      severity: "high",
      status: "open",
      progress: 25
    }
  },
  "nestle-factory": {
    id: "nestle-factory",
    label: "Nestlé Indonesia",
    emoji: "🥛",
    industry: "Food Manufacturing",
    industryLabel: "Food Manufacturing",
    primary: "#16a34a",
    primaryLight: "#22c55e",
    accent: "#4ade80",
    accentMuted: "rgba(22, 163, 74, 0.15)",
    ring: "rgba(22, 163, 74, 0.4)",
    gradient: "from-green-600/20 to-green-900/10",
    sopCount: 742,
    modules: ["Manufacturing", "Quality", "Food Safety", "Compliance"],
    knowledgeTopics: ["HACCP", "GMP", "Food Safety", "Packaging", "CCP", "Batch"],
    domainTerms: ["HACCP", "CCP", "Batch", "Food Safety", "Metal Detector", "Packaging"],
    aiPersonaIntro:
      "Anda adalah AI Food Manufacturing Assistant untuk Nestlé Indonesia. Dukung HACCP, GMP, food safety, packaging, CCP, quality, dan engineering report.",
    aiClarifyingQuestions: ["Packaging?", "Mixer?", "Metal Detector?", "Filling Machine?"],
    defaultUserName: "Budi",
    flagshipIssueKeys: ["metal-detector", "packaging-stop"],
    primaryIssueKey: "metal-detector",
    machineCode: "P-03",
    lineLabel: "Line P-03",
    productionTarget: 21000,
    reportTitle: "HACCP INCIDENT REPORT — FOOD MANUFACTURING",
    primaryIssue: {
      key: "metal-detector",
      title: "Metal Detector Alarm",
      description: "Metal detector alarm triggered on packaging line P-03.",
      severity: "critical",
      status: "investigating",
      progress: 40
    },
    secondaryIssue: {
      key: "packaging-stop",
      title: "Packaging Line Stopped",
      description: "Packaging line P-03 held pending QA and CCP verification.",
      severity: "high",
      status: "open",
      progress: 20
    }
  }
};

export const comingSoonTenants = [
  { id: "siemens", label: "Siemens", emoji: "⚙️", industry: "Industrial Automation", available: false },
  { id: "buek-website", label: "Buek Website", emoji: "🌐", industry: "Website Builder", available: false }
];

export function getTenantTheme(workspaceId: string): TenantTheme | undefined {
  return tenantThemes[workspaceId];
}

export function getTenantThemeOrDefault(workspaceId: string): TenantTheme {
  return (
    tenantThemes[workspaceId] ?? {
      id: workspaceId,
      label: "Custom Workspace",
      emoji: "🏢",
      industry: "General Manufacturing",
      industryLabel: "Manufacturing",
      primary: "#0891b2",
      primaryLight: "#06b6d4",
      accent: "#22d3ee",
      accentMuted: "rgba(8, 145, 178, 0.15)",
      ring: "rgba(8, 145, 178, 0.4)",
      gradient: "from-cyan-600/20 to-cyan-900/10",
      sopCount: 0,
      modules: ["Manufacturing"],
      knowledgeTopics: ["SOP"],
      domainTerms: [],
      aiPersonaIntro: "Anda adalah AI Manufacturing Assistant untuk operasi manufaktur.",
      aiClarifyingQuestions: ["Mesin?", "Produksi?", "Quality?"],
      defaultUserName: "User",
      flagshipIssueKeys: ["vibration"],
      primaryIssueKey: "vibration",
      machineCode: "M-101",
      lineLabel: "Line 1",
      productionTarget: 8400,
      reportTitle: "INVESTIGATION REPORT",
      primaryIssue: {
        key: "vibration",
        title: "Machine Vibration Alarm",
        description: "Elevated vibration detected.",
        severity: "high",
        status: "open",
        progress: 20
      },
      secondaryIssue: {
        key: "quality",
        title: "Quality Alert",
        description: "Quality metric requires attention.",
        severity: "medium",
        status: "open",
        progress: 10
      }
    }
  );
}
