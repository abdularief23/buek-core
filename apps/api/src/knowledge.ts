import { KnowledgeEngine } from "@buek/knowledge";
import type { DomainModule, KnowledgeSource } from "@buek/shared-types";
import type { Request, Response } from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { findWorkspace as resolveWorkspace } from "./workspaces.js";

function readKnowledgeSourceContent(source: KnowledgeSource): string {
  if (!source.contentPath) {
    return source.content ?? source.summary;
  }

  const candidates = [
    resolve(process.cwd(), source.contentPath),
    resolve(process.cwd(), "..", source.contentPath),
    resolve(process.cwd(), "..", "..", source.contentPath)
  ];

  for (const candidate of candidates) {
    try {
      return readFileSync(candidate, "utf8");
    } catch {
      // Try the next known runtime root.
    }
  }

  try {
    return readFileSync(resolve(source.contentPath), "utf8");
  } catch {
    return source.content ?? source.summary;
  }
}

function buildKnowledgeEngine(module: DomainModule, knowledge: KnowledgeSource[]): KnowledgeEngine {
  return new KnowledgeEngine(
    knowledge.map((source) => ({
      source,
      content: readKnowledgeSourceContent(source)
    }))
  );
}

export function handleKnowledgeSearchRequest(
  req: Request,
  res: Response,
  modules: DomainModule[]
): void {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const moduleId = typeof req.query.module === "string" ? req.query.module : modules[0]?.id;
  const workspaceId = typeof req.query.workspace === "string" ? req.query.workspace : undefined;
  const module = modules.find((candidate) => candidate.id === moduleId);

  if (!module) {
    res.status(404).json({
      error: {
        code: "module_not_found",
        message: "Requested module is not installed."
      }
    });
    return;
  }

  let knowledge = module.knowledge;
  if (workspaceId) {
    const workspace = resolveWorkspace(workspaceId);
    if (workspace.knowledgeSourceIds.length) {
      knowledge = knowledge.filter((source) => workspace.knowledgeSourceIds.includes(source.id));
    }
  }

  const engine = buildKnowledgeEngine(module, knowledge);
  const results = query ? engine.search(query, 10) : [];

  res.json({
    module: {
      id: module.id,
      name: module.name
    },
    workspaceId: workspaceId ?? null,
    query,
    totalChunks: engine.listChunks().length,
    results: results.map(({ chunk, score }) => ({
      id: chunk.id,
      score,
      title: chunk.source.title,
      referenceId: chunk.source.referenceId,
      sourceId: chunk.source.id,
      excerpt: chunk.content.replace(/\s+/g, " ").slice(0, 300)
    }))
  });
}
