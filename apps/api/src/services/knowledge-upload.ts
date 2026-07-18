import { prisma } from "../db.js";

export interface KnowledgeDocumentDto {
  id: string;
  title: string;
  type: string;
  referenceId: string | null;
  status: string;
  sourcePath: string | null;
  chunkCount: number;
  createdAt: string;
}

export interface UploadKnowledgeInput {
  workspaceSlug: string;
  title: string;
  type: string;
  content: string;
  referenceId?: string;
  fileName?: string;
}

function chunkText(content: string, maxCharacters = 900): string[] {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
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

  if (current) chunks.push(current);
  return chunks.length ? chunks : [content.slice(0, maxCharacters)];
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 2)
    )
  );
}

function simulateOcr(fileName: string | undefined, content: string): { text: string; ocrApplied: boolean } {
  if (content.trim()) {
    return { text: content.trim(), ocrApplied: false };
  }
  if (fileName?.toLowerCase().endsWith(".pdf")) {
    return {
      text: `[OCR Simulated] Content extracted from ${fileName}. In production, OCR pipeline processes scanned PDF pages.`,
      ocrApplied: true
    };
  }
  return { text: "", ocrApplied: false };
}

async function getWorkspaceContext(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    select: { id: true, companyId: true }
  });
}

export async function listKnowledgeDocuments(slug: string): Promise<KnowledgeDocumentDto[]> {
  const workspace = await getWorkspaceContext(slug);
  if (!workspace) return [];

  const docs = await prisma.knowledgeDocument.findMany({
    where: { workspaceId: workspace.id },
    include: { _count: { select: { embeddings: true } } },
    orderBy: { createdAt: "desc" }
  });

  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    referenceId: doc.referenceId,
    status: doc.status,
    sourcePath: doc.sourcePath,
    chunkCount: doc._count.embeddings,
    createdAt: doc.createdAt.toISOString()
  }));
}

export async function uploadKnowledge(input: UploadKnowledgeInput): Promise<KnowledgeDocumentDto> {
  const workspace = await getWorkspaceContext(input.workspaceSlug);
  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const { text, ocrApplied } = simulateOcr(input.fileName, input.content);
  if (!text) {
    throw new Error("No content to index. Provide text content or a supported file.");
  }

  const chunks = chunkText(text);
  const sourcePath = input.fileName ? `upload://${input.fileName}` : "upload://paste";

  const document = await prisma.knowledgeDocument.create({
    data: {
      companyId: workspace.companyId,
      workspaceId: workspace.id,
      title: input.title,
      type: input.type,
      referenceId: input.referenceId ?? null,
      status: ocrApplied ? "published" : "published",
      sourcePath
    }
  });

  await prisma.embeddingRecord.createMany({
    data: chunks.map((chunkText, index) => ({
      knowledgeId: document.id,
      companyId: workspace.companyId,
      chunkText,
      vectorJson: { tokens: tokenize(chunkText), chunkIndex: index }
    }))
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: workspace.id,
      occurredAt: new Date(),
      title: "Knowledge Uploaded",
      detail: `${input.title} — ${chunks.length} chunks indexed${ocrApplied ? " (OCR)" : ""}`,
      category: "knowledge",
      entityType: "knowledge_document",
      entityId: document.id
    }
  });

  return {
    id: document.id,
    title: document.title,
    type: document.type,
    referenceId: document.referenceId,
    status: document.status,
    sourcePath: document.sourcePath,
    chunkCount: chunks.length,
    createdAt: document.createdAt.toISOString()
  };
}

export async function searchUploadedKnowledge(
  slug: string,
  query: string,
  limit = 10
): Promise<Array<{ id: string; title: string; referenceId: string | null; excerpt: string; score: number }>> {
  const workspace = await getWorkspaceContext(slug);
  if (!workspace || !query.trim()) return [];

  const tokens = tokenize(query);
  const records = await prisma.embeddingRecord.findMany({
    where: { companyId: workspace.companyId, knowledge: { workspaceId: workspace.id } },
    include: { knowledge: true },
    take: 200
  });

  return records
    .map((record) => {
      const haystack = record.chunkText.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += token.length > 5 ? 2 : 1;
      }
      return {
        id: record.id,
        title: record.knowledge.title,
        referenceId: record.knowledge.referenceId,
        excerpt: record.chunkText.replace(/\s+/g, " ").slice(0, 300),
        score
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
