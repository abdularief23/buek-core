export interface DailyWorkspace {
  todayFocus: Array<{ icon: string; label: string }>;
  quickActions: Array<{ icon: string; label: string; prompt: string; contextLabel: string }>;
  continueWorking: Array<{ id: string; label: string; prompt: string }>;
  aiSuggestions: Array<{ text: string; prompt: string }>;
  todayKpi: Array<{
    label: string;
    value: string;
    status: "green" | "yellow" | "red";
    prompt: string;
  }>;
  inbox: { unread: number; aiSummary: string[] };
  meeting: {
    time: string;
    title: string;
    agenda: string[];
    linkLabel: string;
  } | null;
  activityFeed: Array<{ time: string; message: string }>;
  notifications: Array<{
    id: string;
    category: string;
    message: string;
    prompt: string;
  }>;
  knowledgeRecent: Array<{ id: string; label: string; prompt: string }>;
  knowledgeRecentlyUpdated: Array<{ id: string; label: string; prompt: string }>;
  proactiveGreeting: string;
  proactiveCards: Array<{ icon: string; text: string; prompt: string; contextLabel: string }>;
}

export interface ModuleSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  prompts: Array<{ id: string; name: string; description: string }>;
  tools: Array<{ id: string; name: string; description: string }>;
}

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
  documentStats: Array<{ label: string; count: number }>;
  kpis: Array<{ label: string; value: string; status: "green" | "yellow" | "red" }>;
  alerts: Array<{ severity: "warning" | "critical" | "info"; message: string }>;
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
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}

export interface DemoWorkspaceOption {
  id: string;
  label: string;
}

export interface ChatReference {
  id: string;
  title: string;
  referenceId?: string;
  score?: number;
  excerpt?: string;
}

export interface ChatMetadata {
  workspace: {
    id: string;
    name: string;
    organization: string;
    industry: string;
    domain: string;
  };
  detectedModule: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
  };
  references: ChatReference[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: ChatMetadata;
}
