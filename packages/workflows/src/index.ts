import type { WorkflowDefinition } from "@buek/shared-types";

export class WorkflowRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>();

  register(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }
}
