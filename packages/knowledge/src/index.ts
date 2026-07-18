import type { KnowledgeSource } from "@buek/shared-types";

export class KnowledgeIndex {
  private readonly sources = new Map<string, KnowledgeSource>();

  add(source: KnowledgeSource): void {
    this.sources.set(source.id, source);
  }

  list(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }
}
