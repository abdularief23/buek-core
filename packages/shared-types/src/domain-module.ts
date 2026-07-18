export type JsonSchema = Record<string, unknown>;

export type KnowledgeSourceType = "document" | "faq" | "runbook" | "schema" | "policy";

export interface KnowledgeSource {
  id: string;
  title: string;
  type: KnowledgeSourceType;
  summary: string;
  tags: string[];
  contentPath?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: string[];
}

export interface AgentConfiguration {
  id: string;
  name: string;
  description: string;
  model?: string;
  tools: string[];
  knowledge: string[];
  prompts: string[];
  workflows: string[];
}

export interface DomainModule {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  knowledge: KnowledgeSource[];
  tools: ToolDefinition[];
  prompts: PromptTemplate[];
  workflows: WorkflowDefinition[];
  agents: AgentConfiguration[];
}

export interface RegistrySnapshot {
  modules: Array<{
    id: string;
    name: string;
    version: string;
    capabilities: string[];
  }>;
}
