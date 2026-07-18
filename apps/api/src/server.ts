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
  handleApproveWorkOrder,
  handleIssueByKey,
  handleIssueDetail,
  handleIssues,
  handleLiveKpis,
  handleMachineTelemetry,
  handlePendingWorkOrders,
  handleRejectWorkOrder,
  handleSupervisorStats,
  handleTimeline,
  handleWorkOrderDetail
} from "./routes/data.js";
import { handleKnowledgeSearchRequest } from "./knowledge.js";
import {
  authenticateDemoUser,
  authenticateProductionUser,
  demoRoles,
  demoWorkspaceOptions,
  launchDemoWorkspace,
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

  app.get("/api/knowledge/search", (req, res) => {
    handleKnowledgeSearchRequest(req, res, discovery.modules);
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
