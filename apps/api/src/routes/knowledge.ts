import type { Request, Response } from "express";
import multer from "multer";
import {
  listKnowledgeDocuments,
  searchUploadedKnowledge,
  uploadKnowledge,
  uploadKnowledgeBatch
} from "../services/knowledge-upload.js";

export const knowledgeFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 100 }
});

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
      pipeline: ["upload", "parse", "chunking", "embedding", "knowledge_base"],
      message: "Document indexed into Knowledge Layer (read-only)."
    });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Upload failed" } });
  }
}

export async function handleKnowledgeFilesUpload(req: Request, res: Response) {
  try {
    const workspaceId = typeof req.body.workspaceId === "string" ? req.body.workspaceId : "";
    if (!workspaceId) {
      res.status(400).json({ error: { message: "workspaceId is required." } });
      return;
    }

    const files = (req.files as Array<{ originalname: string; buffer: Buffer }> | undefined) ?? [];
    if (!files.length) {
      res.status(400).json({ error: { message: "No files uploaded." } });
      return;
    }

    const result = await uploadKnowledgeBatch(
      workspaceId,
      files.map((file) => ({ fileName: file.originalname, buffer: file.buffer }))
    );

    res.status(201).json({
      ...result,
      pipeline: ["upload", "parse", "ocr", "chunking", "embedding", "knowledge_base"],
      message: `${result.documents.length} document(s) indexed${result.errors.length ? `, ${result.errors.length} failed` : ""}.`
    });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Batch upload failed" } });
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
