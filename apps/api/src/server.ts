import { AgentPlatform, discoverInstalledDomainModules } from "@buek/agents";
import { BuekCore } from "@buek/ai-core";
import cors from "cors";
import express from "express";
import type { ApiEnv } from "./config/env.js";

export async function createServer(env: ApiEnv) {
  const app = express();
  const core = new BuekCore({ defaultModel: env.openAiModel });
  const platform = new AgentPlatform(core);
  const discovery = await discoverInstalledDomainModules({ env: process.env });

  platform.installDomainModules(discovery.modules);

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

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

  app.post("/api/ask", (_req, res) => {
    res.status(501).json({
      message:
        "AI answering is intentionally not implemented in the foundation scaffold. The API, AI Core, and Manufacturing module registration are ready for the next step.",
      registry: platform.getRegistrySnapshot()
    });
  });

  return app;
}
