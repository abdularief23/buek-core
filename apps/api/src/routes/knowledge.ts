import type { Request, Response } from "express";
import {
  listKnowledgeDocuments,
  searchUploadedKnowledge,
  uploadKnowledge
} from "../services/knowledge-upload.js";

export async function handleKnowledgeDocuments(req: Request, res: Response) {
  try {
    const workspace = typeof req.query.workspace === "string" ? req.query.workspace : "";
    if (!workspace) {
      res.status(400).json({ error: { message: "workspace query param required" } });
      return;
    }
    const documents = await listKnowledgeDocuments(workspace);
    res.json({ documents, layer: "knowledge", readOnly: true });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleKnowledgeUpload(req: Request, res: Response) {
  try {
    const body = req.body as {
      workspaceId?: string;
      title?: string;
      type?: string;
      content?: string;
      referenceId?: string;
      fileName?: string;
    };

    if (!body.workspaceId || !body.title || !body.content) {
      res.status(400).json({
        error: { message: "workspaceId, title, and content are required." }
      });
      return;
    }

    const document = await uploadKnowledge({
      workspaceSlug: body.workspaceId,
      title: body.title,
      type: body.type ?? "sop",
      content: body.content,
      ...(body.referenceId ? { referenceId: body.referenceId } : {}),
      ...(body.fileName ? { fileName: body.fileName } : {})
    });

    res.status(201).json({
      document,
      pipeline: ["upload", "ocr", "chunking", "embedding", "knowledge_base"],
      message: "Document indexed into Knowledge Layer (read-only)."
    });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Upload failed" } });
  }
}

export async function handleUploadedKnowledgeSearch(req: Request, res: Response) {
  try {
    const workspace = typeof req.query.workspace === "string" ? req.query.workspace : "";
    const query = typeof req.query.q === "string" ? req.query.q : "";
    if (!workspace) {
      res.status(400).json({ error: { message: "workspace query param required" } });
      return;
    }
    const results = await searchUploadedKnowledge(workspace, query);
    res.json({ query, results, source: "uploaded_knowledge" });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Search failed" } });
  }
}
