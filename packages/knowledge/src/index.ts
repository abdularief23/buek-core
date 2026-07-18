import type { KnowledgeSource } from "@buek/shared-types";

export interface KnowledgeDocument {
  source: KnowledgeSource;
  content: string;
}

export interface KnowledgeChunk {
  id: string;
  source: KnowledgeSource;
  content: string;
  chunkIndex: number;
}

export interface KnowledgeSearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

export class KnowledgeIndex {
  private readonly sources = new Map<string, KnowledgeSource>();

  add(source: KnowledgeSource): void {
    this.sources.set(source.id, source);
  }

  list(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2)
    )
  );
}

function chunkMarkdown(content: string, maxCharacters = 900): string[] {
  const sections = content
    .split(/\n(?=#{1,3}\s)/)
    .map((section) => section.trim())
    .filter(Boolean);
  const chunks: string[] = [];

  for (const section of sections.length ? sections : [content]) {
    if (section.length <= maxCharacters) {
      chunks.push(section);
      continue;
    }

    const paragraphs = section.split(/\n{2,}/).filter(Boolean);
    let current = "";

    for (const paragraph of paragraphs) {
      const next = current ? `${current}\n\n${paragraph}` : paragraph;

      if (next.length > maxCharacters && current) {
        chunks.push(current);
        current = paragraph;
      } else {
        current = next;
      }
    }

    if (current) {
      chunks.push(current);
    }
  }

  return chunks;
}

function scoreChunk(chunk: KnowledgeChunk, query: string): number {
  const tokens = tokenize(query);
  const haystack = [
    chunk.source.title,
    chunk.source.summary,
    chunk.source.tags.join(" "),
    chunk.source.referenceId ?? "",
    chunk.content
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += token.length > 5 ? 2 : 1;
    }
  }

  for (const tag of chunk.source.tags) {
    const normalized = tag.replaceAll("-", " ").toLowerCase();

    if (query.toLowerCase().includes(normalized)) {
      score += 4;
    }
  }

  return score;
}

export class KnowledgeEngine {
  private readonly chunks: KnowledgeChunk[];

  constructor(documents: KnowledgeDocument[]) {
    this.chunks = documents.flatMap((document) =>
      chunkMarkdown(document.content).map((content, index) => ({
        id: `${document.source.id}#${index + 1}`,
        source: document.source,
        content,
        chunkIndex: index
      }))
    );
  }

  listChunks(): KnowledgeChunk[] {
    return this.chunks;
  }

  search(query: string, limit = 8): KnowledgeSearchResult[] {
    return this.chunks
      .map((chunk) => ({ chunk, score: scoreChunk(chunk, query) }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}
