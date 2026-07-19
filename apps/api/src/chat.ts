import { createResponsesClient } from "@buek/ai-core";
import { guardInput, guardOutput } from "@buek/guardrails";
import { KnowledgeEngine } from "@buek/knowledge";
import type { KnowledgeSearchResult } from "@buek/knowledge";
import type { DomainModule, KnowledgeSource } from "@buek/shared-types";
import type { Request, Response } from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ApiEnv } from "./config/env.js";
import { tryExecuteActionFromMessage } from "./services/ai-actions.js";
import {
  resolveChatDataContext,
  shouldUseDirectAnswer
} from "./services/chat-data-context.js";
import { getMemories } from "./services/workflow-data.js";
import {
  buildWorkspaceKnowledgeContext,
  findWorkspace,
  findWorkspaceModule,
  type Workspace
} from "./workspaces.js";
import { getTenantThemeOrDefault } from "./tenants/index.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  workspaceId?: string;
  role?: string;
  chatPersona?: string;
}

interface ChatMetadata {
  workspace: {
    id: string;
    name: string;
    organization: string;
    industry: string;
    domain: string;
  };
  detectedModule: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
  };
  references: Array<{
    id: string;
    title: string;
    referenceId?: string;
    score?: number;
    excerpt?: string;
  }>;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function parseMessages(body: ChatRequestBody): ChatMessage[] {
  if (!Array.isArray(body.messages)) {
    throw new Error("Request body must include a messages array.");
  }

  const messages = body.messages.filter(isChatMessage).map((message) => ({
    role: message.role,
    content: message.content.trim()
  }));

  if (!messages.length || messages.every((message) => message.role !== "user")) {
    throw new Error("At least one user message is required.");
  }

  return messages.filter((message) => message.content.length > 0);
}

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

function buildKnowledgeEngine(module: DomainModule): KnowledgeEngine {
  return new KnowledgeEngine(
    module.knowledge.map((source) => ({
      source,
      content: readKnowledgeSourceContent(source)
    }))
  );
}

function selectKnowledge(module: DomainModule, latestUserMessage: string): KnowledgeSearchResult[] {
  const engine = buildKnowledgeEngine(module);
  const results = engine.search(latestUserMessage, 24);

  if (results.length) {
    const seenSources = new Set<string>();
    const diversified: KnowledgeSearchResult[] = [];

    for (const result of results) {
      if (seenSources.has(result.chunk.source.id)) {
        continue;
      }

      seenSources.add(result.chunk.source.id);
      diversified.push(result);

      if (diversified.length >= 8) {
        break;
      }
    }

    return diversified;
  }

  return engine
    .listChunks()
    .slice(0, 6)
    .map((chunk) => ({ chunk, score: 0 }));
}

function buildInstructions(
  workspace: Workspace,
  module: DomainModule,
  selectedKnowledge: KnowledgeSearchResult[],
  memories: Array<{ scope: string; content: string }> = [],
  actionContext = "",
  rolePersona = "",
  dataSnapshot = ""
): string {
  const knowledgeText = selectedKnowledge
    .map(({ chunk }) =>
      [`${chunk.source.referenceId ?? chunk.source.id}: ${chunk.source.title}`, chunk.content].join(
        "\n"
      )
    )
    .join("\n\n");

  const tenant = getTenantThemeOrDefault(workspace.id);

  return [
    "You are Buek Core, an enterprise AI assistant for manufacturing operations.",
    tenant.aiPersonaIntro,
    tenant.forbiddenTerms.length
      ? `NEVER discuss or recommend actions involving: ${tenant.forbiddenTerms.join(", ")}.`
      : "",
    rolePersona ? `User context: ${rolePersona}` : "",
    `Workspace: ${workspace.name} (${workspace.organization}).`,
    "",
    "RULES:",
    "- Use ONLY the LIVE DATABASE SNAPSHOT below for factual answers (counts, statuses, names).",
    "- NEVER invent data. If snapshot is empty for a topic, say you cannot access that data.",
    "- Do NOT mention: detected module, reasoning, developer prompts, OpenAI, hackathon, internal systems.",
    "- Respond in natural Bahasa Indonesia.",
    "- Use ## headings only when helpful. No 'Detected Module' or 'Reasoning' headings.",
    "",
    "LIVE DATABASE SNAPSHOT (authoritative):",
    dataSnapshot || "General workspace context only — do not invent operational facts.",
    "",
    actionContext ? `Recent actions:\n${actionContext}` : "",
    memories.length
      ? ["Memory:", ...memories.map((m) => `- ${m.content}`)].join("\n")
      : "",
    "",
    "Company knowledge:",
    knowledgeText
  ]
    .filter(Boolean)
    .join("\n");
}

function buildInput(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");
}

function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sanitizeErrorMessage(message: string): string {
  const guarded = guardOutput({ text: message, toolsExecuted: [] });

  if (/api[\s_-]?key|credential|unauthorized/i.test(message)) {
    return "OpenAI request failed. Check server credentials.";
  }

  return guarded.text;
}

export async function handleChatRequest(
  req: Request,
  res: Response,
  env: ApiEnv,
  modules: DomainModule[]
): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const requestBody = req.body as ChatRequestBody;
    const messages = parseMessages(requestBody);
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")?.content;

    if (!latestUserMessage) {
      throw new Error("A user message is required.");
    }

    const workspace = findWorkspace(requestBody.workspaceId);
    const workspaceModule = findWorkspaceModule(workspace, modules);
    const workspaceSlug = workspace.id;
    const rolePersona =
      typeof requestBody.chatPersona === "string" && requestBody.chatPersona.trim()
        ? requestBody.chatPersona
        : typeof requestBody.role === "string" && requestBody.role.trim()
          ? `User role: ${requestBody.role}.`
          : "";

    const actionResult = await tryExecuteActionFromMessage(workspaceSlug, latestUserMessage);
    const dataContext = await resolveChatDataContext(workspaceSlug, latestUserMessage);
    const memories = await getMemories(workspaceSlug);
    const actionContext = actionResult
      ? `Action executed: ${actionResult.toolName} — ${actionResult.message}`
      : "";

    if (actionResult?.success) {
      sendEvent(res, "action", actionResult);
    }

    if (shouldUseDirectAnswer(dataContext, latestUserMessage) && dataContext.directAnswer) {
      sendEvent(res, "delta", { text: dataContext.directAnswer });
      sendEvent(res, "done", {});
      res.end();
      return;
    }

    const inputGuard = guardInput({
      text: latestUserMessage,
      modules: [workspaceModule],
      domainContext: buildWorkspaceKnowledgeContext(workspace, workspaceModule.knowledge),
      maxCharacters: 3000
    });

    if (!inputGuard.allowed) {
      sendEvent(res, "error", {
        code: inputGuard.error.code,
        message: inputGuard.error.message,
        details: inputGuard.error.details
      });
      res.end();
      return;
    }

    const detectedModule = inputGuard.detectedModule;
    const selectedKnowledge = selectKnowledge(detectedModule, latestUserMessage);

    if (!env.openAiApiKey) {
      sendEvent(res, "error", {
        code: "missing_openai_api_key",
        message: "OPENAI_API_KEY is not configured on the API server."
      });
      res.end();
      return;
    }

    const metadata: ChatMetadata = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        organization: workspace.organization,
        industry: workspace.industry,
        domain: workspace.domain
      },
      detectedModule: {
        id: detectedModule.id,
        name: detectedModule.name,
        description: detectedModule.description,
        capabilities: detectedModule.capabilities
      },
      references: selectedKnowledge.map(({ chunk, score }) => ({
        id: chunk.source.id,
        title: chunk.source.title,
        score,
        excerpt: chunk.content.replace(/\s+/g, " ").slice(0, 220),
        ...(chunk.source.referenceId ? { referenceId: chunk.source.referenceId } : {})
      }))
    };

    // Metadata for internal debugging only — not rendered in user chat UI.
    sendEvent(res, "metadata", metadata);

    const client = createResponsesClient({ apiKey: env.openAiApiKey });
    const stream = await client.responses.create({
      model: env.openAiModel,
      instructions: buildInstructions(
        workspace,
        detectedModule,
        selectedKnowledge,
        memories,
        actionContext,
        rolePersona,
        dataContext.snapshot
      ),
      input: buildInput(messages),
      stream: true,
      max_output_tokens: 900
    });

    let streamedText = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const guardedDelta = guardOutput({ text: event.delta, toolsExecuted: actionResult ? [actionResult.toolName] : [] });
        streamedText += guardedDelta.text;
        sendEvent(res, "delta", { text: guardedDelta.text });
      }

      if (event.type === "response.failed") {
        sendEvent(res, "error", {
          message: sanitizeErrorMessage(
            event.response.error?.message ?? "The OpenAI response failed."
          )
        });
      }
    }

    const finalOutputGuard = guardOutput({ text: streamedText, toolsExecuted: actionResult ? [actionResult.toolName] : [] });

    if (finalOutputGuard.warnings.length) {
      sendEvent(res, "guardrail", {
        warnings: finalOutputGuard.warnings
      });
    }

    sendEvent(res, "done", {});
    res.end();
  } catch (error) {
    sendEvent(res, "error", {
      message:
        error instanceof Error
          ? sanitizeErrorMessage(error.message)
          : "Unable to complete chat request."
    });
    res.end();
  }
}
