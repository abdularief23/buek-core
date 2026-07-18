import type { DomainModule, KnowledgeSource } from "@buek/shared-types";

export interface Workspace {
  id: string;
  name: string;
  organization: string;
  industry: string;
  domain: string;
  moduleId: string;
  description: string;
  knowledgeCollections: string[];
}

export const workspaces: Workspace[] = [
  {
    id: "epson-factory",
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
    ]
  }
];

export function getDefaultWorkspace(): Workspace {
  return workspaces[0]!;
}

export function findWorkspace(workspaceId?: string): Workspace {
  return workspaces.find((workspace) => workspace.id === workspaceId) ?? getDefaultWorkspace();
}

export function findWorkspaceModule(workspace: Workspace, modules: DomainModule[]): DomainModule {
  const module = modules.find((candidate) => candidate.id === workspace.moduleId);

  if (!module) {
    throw new Error(`Workspace module "${workspace.moduleId}" is not installed.`);
  }

  return module;
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
