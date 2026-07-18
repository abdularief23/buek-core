export interface RoleHomeData {
  roleKey: "operator" | "engineer" | "supervisor" | "manager";
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

export interface DailyWorkspace {
  dailyBrief: Array<{
    id: string;
    severity: "critical" | "warning" | "success";
    icon: string;
    title: string;
    detail: string;
    confidence?: string;
    actionLabel: string;
    prompt: string;
    contextLabel: string;
  }>;
  focusCategories: Array<{
    id: string;
    label: string;
    status: "green" | "yellow" | "red";
    summary: string;
    prompt: string;
  }>;
  copilotSuggestions: Array<{ label: string; prompt: string }>;
  recentSearchCategories: string[];
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
