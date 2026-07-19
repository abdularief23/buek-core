import type { Request, Response } from "express";
import { executeAiAction } from "../services/ai-actions.js";
import {
  advanceInvestigationStep,
  approveWorkOrder,
  getIssueById,
  getIssueByKey,
  getIssues,
  getLiveKpis,
  getMachineTelemetry,
  getPendingWorkOrders,
  getSupervisorStats,
  getTimeline,
  getWorkOrderById,
  rejectWorkOrder
} from "../services/data-engine.js";
import { listActiveWorkflows } from "../services/workflow-engine.js";
import { getNotifications } from "../services/notifications.js";
import { getBusinessRules, evaluateBusinessRules, getCriticalAlerts } from "../services/business-rules.js";
import { listConnectors, fetchOperationalSnapshot } from "../connectors/index.js";
import { getKpiDetail, getProductionDashboard } from "../services/production-dashboard.js";
import { getComplaintById, getComplaints } from "../services/customer-complaints.js";
import { submitOperatorReport } from "../services/operator-report.js";
import { getInvestigationCopilot } from "../services/investigation-copilot.js";
import { getCompanyBrainHierarchy } from "../services/company-brain.js";
import {
  approveEngineeringAnalysis,
  generateReportFromAnalysis,
  getEngineerIssueMetrics,
  getEngineeringAnalysis,
  getPendingEngineeringAnalyses,
  rejectEngineeringAnalysis,
  saveEngineeringAnalysis,
  submitEngineeringAnalysis,
  submitVerificationResult
} from "../services/engineering-analysis.js";
import {
  approveReport,
  approveSopRevision,
  createDraftReport,
  getAiSuggestionForIssue,
  getLessonsLearned,
  getMemories,
  getOperatorChecklist,
  getOperatorOptions,
  updateOperatorContext,
  getPendingReports,
  getPendingSopRevisions,
  getReportById,
  getReportExportDocx,
  getReportExportHtml,
  getSopRevisionById,
  rejectReport,
  rejectSopRevision,
  requestReportRevision,
  submitReportForApproval,
  toggleChecklistItem,
  updateReportSections
} from "../services/workflow-data.js";

function getSlug(req: Request): string {
  return String(req.params.slug ?? req.query.workspaceId ?? "");
}

function permissionStatus(message: string): number {
  return /only |cannot |not allowed/i.test(message) ? 403 : 500;
}

export async function handleTimeline(req: Request, res: Response) {
  try {
    const timeline = await getTimeline(getSlug(req));
    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleLiveKpis(req: Request, res: Response) {
  try {
    const kpis = await getLiveKpis(getSlug(req));
    res.json({ kpis });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleSupervisorStats(req: Request, res: Response) {
  try {
    const stats = await getSupervisorStats(getSlug(req));
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handlePendingWorkOrders(req: Request, res: Response) {
  try {
    const workOrders = await getPendingWorkOrders(getSlug(req));
    res.json({ workOrders });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleWorkOrderDetail(req: Request, res: Response) {
  try {
    const order = await getWorkOrderById(getSlug(req), String(req.params.workOrderId));
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleApproveWorkOrder(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string };
    const order = await approveWorkOrder(
      getSlug(req),
      String(req.params.workOrderId),
      body.supervisorName ?? "Supervisor",
      body.role
    );
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleRejectWorkOrder(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; notes?: string };
    const order = await rejectWorkOrder(
      getSlug(req),
      String(req.params.workOrderId),
      body.supervisorName ?? "Supervisor",
      body.notes
    );
    if (!order) {
      res.status(404).json({ error: { message: "Work order not found" } });
      return;
    }
    res.json({ workOrder: order });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssues(req: Request, res: Response) {
  try {
    const status = req.query.status ? String(req.query.status).split(",") : undefined;
    const issues = await getIssues(getSlug(req), status);
    res.json({ issues });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssueDetail(req: Request, res: Response) {
  try {
    const issue = await getIssueById(getSlug(req), String(req.params.issueId));
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleIssueByKey(req: Request, res: Response) {
  try {
    const issue = await getIssueByKey(getSlug(req), String(req.params.issueKey));
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleAdvanceInvestigation(req: Request, res: Response) {
  try {
    const body = req.body as { stepKey: string; role?: string };
    const issue = await advanceInvestigationStep(
      getSlug(req),
      String(req.params.issueId),
      body.stepKey,
      body.role
    );
    if (!issue) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ issue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleMachineTelemetry(req: Request, res: Response) {
  try {
    const telemetry = await getMachineTelemetry(getSlug(req), String(req.params.machineCode));
    res.json({ telemetry });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleWorkflows(req: Request, res: Response) {
  try {
    const workflows = await listActiveWorkflows(getSlug(req));
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handlePendingSopRevisions(req: Request, res: Response) {
  try {
    res.json({ revisions: await getPendingSopRevisions(getSlug(req)) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleSopRevisionDetail(req: Request, res: Response) {
  try {
    const revision = await getSopRevisionById(getSlug(req), String(req.params.revisionId));
    if (!revision) {
      res.status(404).json({ error: { message: "SOP revision not found" } });
      return;
    }
    res.json({ revision });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleApproveSopRevision(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string };
    const revision = await approveSopRevision(
      getSlug(req),
      String(req.params.revisionId),
      body.supervisorName ?? "Supervisor",
      body.role ?? ""
    );
    res.json({ revision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleRejectSopRevision(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string };
    const revision = await rejectSopRevision(
      getSlug(req),
      String(req.params.revisionId),
      body.supervisorName ?? "Supervisor",
      body.role ?? ""
    );
    res.json({ revision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handlePendingReports(req: Request, res: Response) {
  try {
    res.json({ reports: await getPendingReports(getSlug(req)) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleReportDetail(req: Request, res: Response) {
  try {
    const report = await getReportById(getSlug(req), String(req.params.reportId));
    if (!report) {
      res.status(404).json({ error: { message: "Report not found" } });
      return;
    }
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleReportExport(req: Request, res: Response) {
  try {
    const slug = getSlug(req);
    const reportId = String(req.params.reportId);
    const format = typeof req.query.format === "string" ? req.query.format : "html";

    if (format === "docx") {
      const buffer = await getReportExportDocx(slug, reportId);
      if (!buffer) {
        res.status(404).json({ error: { message: "Report not found" } });
        return;
      }
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename="report-${reportId}.docx"`);
      res.send(buffer);
      return;
    }

    const html = await getReportExportHtml(slug, reportId);
    if (!html) {
      res.status(404).json({ error: { message: "Report not found" } });
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleApproveReport(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string };
    const report = await approveReport(
      getSlug(req),
      String(req.params.reportId),
      body.supervisorName ?? "Supervisor",
      body.role ?? ""
    );
    res.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleRejectReport(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string };
    const report = await rejectReport(
      getSlug(req),
      String(req.params.reportId),
      body.supervisorName ?? "Supervisor",
      body.role ?? ""
    );
    res.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleRequestReportRevision(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName?: string; role?: string; notes?: string };
    const report = await requestReportRevision(
      getSlug(req),
      String(req.params.reportId),
      body.supervisorName ?? "Supervisor",
      body.role ?? "",
      body.notes
    );
    res.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleOperatorReport(req: Request, res: Response) {
  try {
    const body = req.body as {
      problem: string;
      shift: string;
      machineCode: string;
      occurredAt: string;
      rejectCount: number;
      notes?: string;
      reporterName: string;
      role?: string;
    };
    const result = await submitOperatorReport(getSlug(req), body, body.role);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleCreateDraftReport(req: Request, res: Response) {
  try {
    const body = req.body as {
      issueKey: string;
      engineerName: string;
      role?: string;
      investigationDraft?: Record<string, unknown>;
    };
    const suggestion = await getAiSuggestionForIssue(getSlug(req), body.issueKey);
    const result = await createDraftReport(
      getSlug(req),
      body.issueKey,
      body.engineerName,
      suggestion,
      body.role,
      body.investigationDraft
    );
    if (!result?.report) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ report: result.report, workOrder: result.workOrder ?? null, aiSuggestion: suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleUpdateReportSections(req: Request, res: Response) {
  try {
    const body = req.body as {
      sections: Record<string, string | string[]>;
      engineerName: string;
      role?: string;
    };
    const report = await updateReportSections(
      getSlug(req),
      String(req.params.reportId),
      body.sections as unknown as Parameters<typeof updateReportSections>[2],
      body.engineerName,
      body.role
    );
    if (!report) {
      res.status(404).json({ error: { message: "Report not found" } });
      return;
    }
    res.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleSubmitReport(req: Request, res: Response) {
  try {
    const body = req.body as { engineerName: string; role?: string };
    const report = await submitReportForApproval(
      getSlug(req),
      String(req.params.reportId),
      body.engineerName,
      body.role
    );
    if (!report) {
      res.status(404).json({ error: { message: "Report not found" } });
      return;
    }
    res.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleAiSuggestion(req: Request, res: Response) {
  try {
    const suggestion = await getAiSuggestionForIssue(getSlug(req), String(req.params.issueKey));
    res.json({ suggestion });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleInvestigationCopilot(req: Request, res: Response) {
  try {
    const copilot = await getInvestigationCopilot(getSlug(req), String(req.params.issueKey));
    if (!copilot) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json({ copilot });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleEngineerMetrics(req: Request, res: Response) {
  try {
    const metrics = await getEngineerIssueMetrics(getSlug(req));
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handlePendingEngineeringAnalyses(req: Request, res: Response) {
  try {
    const pending = await getPendingEngineeringAnalyses(getSlug(req));
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleGetEngineeringAnalysis(req: Request, res: Response) {
  try {
    const data = await getEngineeringAnalysis(getSlug(req), String(req.params.issueKey));
    if (!data) {
      res.status(404).json({ error: { message: "Issue not found" } });
      return;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleSaveEngineeringAnalysis(req: Request, res: Response) {
  try {
    const body = req.body as { analysis: Record<string, unknown>; role?: string };
    const analysis = await saveEngineeringAnalysis(
      getSlug(req),
      String(req.params.issueKey),
      body.analysis as unknown as Parameters<typeof saveEngineeringAnalysis>[2],
      body.role
    );
    res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleSubmitEngineeringAnalysis(req: Request, res: Response) {
  try {
    const body = req.body as { analysis: Record<string, unknown>; engineerName: string; role?: string };
    const analysis = await submitEngineeringAnalysis(
      getSlug(req),
      String(req.params.issueKey),
      body.analysis as unknown as Parameters<typeof submitEngineeringAnalysis>[2],
      body.engineerName,
      body.role
    );
    res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleApproveEngineeringAnalysis(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName: string; role: string };
    const analysis = await approveEngineeringAnalysis(
      getSlug(req),
      String(req.params.issueKey),
      body.supervisorName,
      body.role
    );
    res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleRejectEngineeringAnalysis(req: Request, res: Response) {
  try {
    const body = req.body as { supervisorName: string; role: string; notes?: string };
    const analysis = await rejectEngineeringAnalysis(
      getSlug(req),
      String(req.params.issueKey),
      body.supervisorName,
      body.role,
      body.notes
    );
    res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleSubmitVerification(req: Request, res: Response) {
  try {
    const body = req.body as {
      countermeasureComplete: boolean;
      currentPpm: number;
      targetPpm: number;
      lessonsLearned?: string;
      engineerName: string;
      role?: string;
    };
    const analysis = await submitVerificationResult(
      getSlug(req),
      String(req.params.issueKey),
      body,
      body.engineerName,
      body.role
    );
    res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleGenerateReportFromAnalysis(req: Request, res: Response) {
  try {
    const body = req.body as { engineerName: string; role?: string };
    const result = await generateReportFromAnalysis(
      getSlug(req),
      String(req.params.issueKey),
      body.engineerName,
      body.role
    );
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleCompanyBrain(req: Request, res: Response) {
  try {
    const hierarchy = await getCompanyBrainHierarchy(getSlug(req));
    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleLessonsLearned(req: Request, res: Response) {
  try {
    const lessons = await getLessonsLearned(getSlug(req));
    res.json({ lessons });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleOperatorChecklist(req: Request, res: Response) {
  try {
    res.json({ checklist: await getOperatorChecklist(getSlug(req)) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleOperatorOptions(req: Request, res: Response) {
  try {
    res.json({ options: await getOperatorOptions(getSlug(req)) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleUpdateOperatorContext(req: Request, res: Response) {
  try {
    const body = req.body as { line?: string; shift?: string; machineCode?: string; role?: string };
    const checklist = await updateOperatorContext(
      getSlug(req),
      {
        ...(body.line ? { line: body.line } : {}),
        ...(body.shift ? { shift: body.shift } : {}),
        ...(body.machineCode ? { machineCode: body.machineCode } : {})
      },
      body.role
    );
    res.json({ checklist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleToggleChecklistItem(req: Request, res: Response) {
  try {
    const body = req.body as { itemId: string; role?: string };
    res.json({ checklist: await toggleChecklistItem(getSlug(req), body.itemId, body.role) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    res.status(permissionStatus(message)).json({ error: { message } });
  }
}

export async function handleMemory(req: Request, res: Response) {
  try {
    const scope = req.query.scope ? String(req.query.scope) : undefined;
    res.json({ memories: await getMemories(getSlug(req), scope) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleNotifications(req: Request, res: Response) {
  try {
    const notifications = await getNotifications(getSlug(req));
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleProductionDashboard(req: Request, res: Response) {
  try {
    res.json({ dashboard: await getProductionDashboard(getSlug(req)) });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleKpiDetail(req: Request, res: Response) {
  try {
    const label = String(req.params.kpiLabel ?? "");
    const detail = await getKpiDetail(getSlug(req), decodeURIComponent(label));
    if (!detail) {
      res.status(404).json({ error: { message: "KPI not found" } });
      return;
    }
    res.json({ kpi: detail });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleAiAction(req: Request, res: Response) {
  try {
    const body = req.body as { action: string; params?: Record<string, string> };
    const result = await executeAiAction(
      getSlug(req),
      body.action as Parameters<typeof executeAiAction>[1],
      body.params ?? {}
    );
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleConnectors(req: Request, res: Response) {
  try {
    const slug = getSlug(req);
    const [connectors, snapshot] = await Promise.all([
      Promise.resolve(listConnectors()),
      fetchOperationalSnapshot(slug)
    ]);
    res.json({ connectors, snapshot, principle: "Buek Core reads operational data — it does not replace ERP/MES." });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleBusinessRules(req: Request, res: Response) {
  try {
    const rules = await getBusinessRules(getSlug(req));
    res.json({ rules, principle: "Critical severity is determined by business rules — not by AI." });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleEvaluateRules(req: Request, res: Response) {
  try {
    const evaluations = await evaluateBusinessRules(getSlug(req));
    res.json({ evaluations });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleCriticalAlerts(req: Request, res: Response) {
  try {
    const alerts = await getCriticalAlerts(getSlug(req));
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleComplaints(req: Request, res: Response) {
  try {
    const status = req.query.status ? String(req.query.status).split(",") : undefined;
    const complaints = await getComplaints(getSlug(req), status);
    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}

export async function handleComplaintDetail(req: Request, res: Response) {
  try {
    const complaint = await getComplaintById(getSlug(req), String(req.params.complaintId));
    if (!complaint) {
      res.status(404).json({ error: { message: "Complaint not found" } });
      return;
    }
    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: { message: error instanceof Error ? error.message : "Failed" } });
  }
}
