import type { PromptTemplate } from "@buek/shared-types";

export class PromptLibrary {
  private readonly prompts = new Map<string, PromptTemplate>();

  add(prompt: PromptTemplate): void {
    this.prompts.set(prompt.id, prompt);
  }

  list(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }
}
