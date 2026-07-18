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
  factoryHealth: {
    status: "healthy" | "attention" | "critical";
    message: string;
  };
  summaryCounts: {
    maintenanceAlerts: number;
    qualityIssues: number;
  };
  continueWorking: Array<{
    id: string;
    label: string;
    prompt?: string;
  }>;
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
}

export interface DemoUser {
  id: string;
  companyId: string;
  username: string;
  name: string;
  role: string;
  workspaceId: string;
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

export type ActiveView = "home" | "chat" | "workspace" | "settings";
