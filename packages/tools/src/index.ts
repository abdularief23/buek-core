import type { ToolDefinition } from "@buek/shared-types";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool "${tool.id}" is already registered.`);
    }

    this.tools.set(tool.id, tool);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
