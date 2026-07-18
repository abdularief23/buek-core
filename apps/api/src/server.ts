import { AgentPlatform, discoverInstalledDomainModules } from "@buek/agents";
import { BuekCore } from "@buek/ai-core";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleChatRequest } from "./chat.js";
import type { ApiEnv } from "./config/env.js";
import {
  handleAdvanceInvestigation,
  handleAiAction,
  handleAiSuggestion,
  handleApproveReport,
  handleApproveSopRevision,
  handleApproveWorkOrder,
  handleCreateDraftReport,
  handleIssueByKey,
  handleIssueDetail,
  handleIssues,
  handleLessonsLearned,
  handleLiveKpis,
  handleMachineTelemetry,
  handleMemory,
  handleNotifications,
  handleOperatorChecklist,
  handleOperatorReport,
  handlePendingReports,
  handlePendingSopRevisions,
  handlePendingWorkOrders,
  handleProductionDashboard,
  handleKpiDetail,
  handleRejectReport,
  handleRejectSopRevision,
  handleRejectWorkOrder,
  handleReportDetail,
  handleRequestReportRevision,
  handleSopRevisionDetail,
  handleSubmitReport,
  handleSupervisorStats,
  handleTimeline,
  handleToggleChecklistItem,
  handleUpdateReportSections,
  handleWorkOrderDetail,
  handleWorkflows,
  handleConnectors,
  handleBusinessRules,
  handleEvaluateRules,
  handleCriticalAlerts
} from "./routes/data.js";
import {
  handleKnowledgeDocuments,
  handleKnowledgeUpload,
  handleUploadedKnowledgeSearch
} from "./routes/knowledge.js";
import { handleKnowledgeSearchRequest } from "./knowledge.js";
import {
  authenticateDemoUser,
  authenticateProductionUser,
  demoComingSoonOptions,
  demoRoles,
  demoWorkspaceOptions,
  launchDemoWorkspace,
  refreshRoleHome,
  workspaces
} from "./workspaces.js";

export async function createServer(env: ApiEnv): Promise<Express> {
  const app = express();
  const core = new BuekCore({ defaultModel: env.openAiModel });
  const platform = new AgentPlatform(core);
  const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const discovery = await discoverInstalledDomainModules({
    env: process.env,
    resolveFrom: [apiRoot, process.cwd()]
  });

  platform.installDomainModules(discovery.modules);

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  const chatRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "rate_limit_exceeded",
        message: "Too many AI requests. Please wait a minute and try again."
      }
    }
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "buek-core-api",
      environment: env.nodeEnv
    });
  });

  app.get("/api/architecture", (_req, res) => {
    res.json({
      name: "Buek Core",
      purpose: "Reusable AI platform with modular industry knowledge.",
      coreModules: [
        "AI Core",
        "Agent System",
        "Memory",
        "Knowledge",
        "Tool Registry",
        "Workflow Engine",
        "Prompt Library",
        "Shared Types"
      ],
      firstVertical: "Manufacturing"
    });
  });

  app.get("/api/modules", (_req, res) => {
    res.json({
      registry: platform.getRegistrySnapshot(),
      discoveryErrors: discovery.errors
    });
  });

  app.get("/api/workspaces", (_req, res) => {
    res.json({ workspaces });
  });

  app.get("/api/auth/demo-options", (_req, res) => {
    res.json({
      workspaces: demoWorkspaceOptions,
      comingSoon: demoComingSoonOptions,
      roles: demoRoles
    });
  });

  app.post("/api/auth/demo-launch", async (req, res) => {
    const body = req.body as Partial<{
      workspaceId: string;
      role: string;
    }>;

    const result = await launchDemoWorkspace(body.workspaceId ?? "", body.role ?? "");

    if (!result) {
      res.status(400).json({
        error: {
          code: "invalid_demo_launch",
          message: "Unable to launch demo workspace."
        }
      });
      return;
    }

    res.json(result);
  });

  app.get("/api/auth/refresh-role-home", async (req, res) => {
    const workspaceId = typeof req.query.workspaceId === "string" ? req.query.workspaceId : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";

    if (!workspaceId || !role) {
      res.status(400).json({
        error: { code: "invalid_request", message: "workspaceId and role are required." }
      });
      return;
    }

    try {
      const roleHome = await refreshRoleHome(workspaceId, role);
      res.json({ roleHome });
    } catch {
      res.status(404).json({
        error: { code: "workspace_not_found", message: "Workspace not found." }
      });
    }
  });

  app.post("/api/auth/sign-in", async (req, res) => {
    const body = req.body as Partial<{
      email: string;
      password: string;
    }>;

    const result = await authenticateProductionUser(body.email ?? "", body.password ?? "");

    if (!result) {
      res.status(401).json({
        error: {
          code: "invalid_credentials",
          message: "Invalid email or password."
        }
      });
      return;
    }

    res.json(result);
  });

  app.post("/api/auth/demo-login", async (req, res) => {
    const body = req.body as Partial<{
      companyId: string;
      username: string;
      password: string;
    }>;

    const result = await authenticateDemoUser(body.companyId ?? "", body.username ?? "", body.password ?? "");

    if (!result) {
      res.status(401).json({
        error: {
          code: "invalid_demo_login",
          message: "Invalid demo credentials."
        }
      });
      return;
    }

    res.json(result);
  });

  app.get("/api/data/:slug/timeline", (req, res) => void handleTimeline(req, res));
  app.get("/api/data/:slug/kpis/live", (req, res) => void handleLiveKpis(req, res));
  app.get("/api/data/:slug/supervisor/stats", (req, res) => void handleSupervisorStats(req, res));
  app.get("/api/data/:slug/work-orders/pending", (req, res) => void handlePendingWorkOrders(req, res));
  app.get("/api/data/:slug/work-orders/:workOrderId", (req, res) => void handleWorkOrderDetail(req, res));
  app.post("/api/data/:slug/work-orders/:workOrderId/approve", (req, res) => void handleApproveWorkOrder(req, res));
  app.post("/api/data/:slug/work-orders/:workOrderId/reject", (req, res) => void handleRejectWorkOrder(req, res));
  app.get("/api/data/:slug/issues", (req, res) => void handleIssues(req, res));
  app.get("/api/data/:slug/issues/key/:issueKey", (req, res) => void handleIssueByKey(req, res));
  app.get("/api/data/:slug/issues/:issueId", (req, res) => void handleIssueDetail(req, res));
  app.post("/api/data/:slug/issues/:issueId/advance", (req, res) => void handleAdvanceInvestigation(req, res));
  app.get("/api/data/:slug/machines/:machineCode/telemetry", (req, res) => void handleMachineTelemetry(req, res));
  app.get("/api/data/:slug/workflows", (req, res) => void handleWorkflows(req, res));
  app.get("/api/data/:slug/sop-revisions/pending", (req, res) => void handlePendingSopRevisions(req, res));
  app.get("/api/data/:slug/sop-revisions/:revisionId", (req, res) => void handleSopRevisionDetail(req, res));
  app.post("/api/data/:slug/sop-revisions/:revisionId/approve", (req, res) => void handleApproveSopRevision(req, res));
  app.post("/api/data/:slug/sop-revisions/:revisionId/reject", (req, res) => void handleRejectSopRevision(req, res));
  app.get("/api/data/:slug/reports/pending", (req, res) => void handlePendingReports(req, res));
  app.get("/api/data/:slug/reports/:reportId", (req, res) => void handleReportDetail(req, res));
  app.post("/api/data/:slug/reports/draft", (req, res) => void handleCreateDraftReport(req, res));
  app.put("/api/data/:slug/reports/:reportId/sections", (req, res) => void handleUpdateReportSections(req, res));
  app.post("/api/data/:slug/reports/:reportId/submit", (req, res) => void handleSubmitReport(req, res));
  app.post("/api/data/:slug/reports/:reportId/approve", (req, res) => void handleApproveReport(req, res));
  app.post("/api/data/:slug/reports/:reportId/reject", (req, res) => void handleRejectReport(req, res));
  app.post("/api/data/:slug/reports/:reportId/request-revision", (req, res) => void handleRequestReportRevision(req, res));
  app.post("/api/data/:slug/operator/report", (req, res) => void handleOperatorReport(req, res));
  app.get("/api/data/:slug/issues/:issueKey/ai-suggestion", (req, res) => void handleAiSuggestion(req, res));
  app.get("/api/data/:slug/lessons-learned", (req, res) => void handleLessonsLearned(req, res));
  app.get("/api/data/:slug/operator/checklist", (req, res) => void handleOperatorChecklist(req, res));
  app.post("/api/data/:slug/operator/checklist/toggle", (req, res) => void handleToggleChecklistItem(req, res));
  app.get("/api/data/:slug/memory", (req, res) => void handleMemory(req, res));
  app.get("/api/data/:slug/production", (req, res) => void handleProductionDashboard(req, res));
  app.get("/api/data/:slug/kpis/:kpiLabel", (req, res) => void handleKpiDetail(req, res));
  app.get("/api/data/:slug/notifications", (req, res) => void handleNotifications(req, res));
  app.get("/api/data/:slug/connectors", (req, res) => void handleConnectors(req, res));
  app.get("/api/data/:slug/business-rules", (req, res) => void handleBusinessRules(req, res));
  app.post("/api/data/:slug/business-rules/evaluate", (req, res) => void handleEvaluateRules(req, res));
  app.get("/api/data/:slug/critical-alerts", (req, res) => void handleCriticalAlerts(req, res));
  app.post("/api/data/:slug/ai/actions", (req, res) => void handleAiAction(req, res));

  app.get("/api/knowledge/documents", (req, res) => void handleKnowledgeDocuments(req, res));
  app.post("/api/knowledge/upload", (req, res) => void handleKnowledgeUpload(req, res));
  app.get("/api/knowledge/uploaded/search", (req, res) => void handleUploadedKnowledgeSearch(req, res));

  app.get("/api/knowledge/search", (req, res) => {
    void handleKnowledgeSearchRequest(req, res, discovery.modules);
  });

  app.post("/api/ask", (_req, res) => {
    res.status(501).json({
      message:
        "AI answering is intentionally not implemented in the foundation scaffold. The API, AI Core, and Manufacturing module registration are ready for the next step.",
      registry: platform.getRegistrySnapshot()
    });
  });

  app.post("/api/chat", chatRateLimit, (req, res) => {
    void handleChatRequest(req, res, env, discovery.modules);
  });

  return app;
}
