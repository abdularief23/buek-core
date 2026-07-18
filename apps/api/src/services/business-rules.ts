import { prisma } from "../db.js";
import { fetchOperationalSnapshot } from "../connectors/index.js";

export interface BusinessRuleDto {
  id: string;
  name: string;
  category: string;
  metric: string;
  operator: string;
  threshold: number | null;
  severity: string;
  enabled: boolean;
  description: string | null;
}

export interface RuleEvaluationResult {
  rule: BusinessRuleDto;
  triggered: boolean;
  currentValue: number | null;
  message: string;
}

export interface CriticalAlertDto {
  id: string;
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  message: string;
  metric: string;
  currentValue: number | null;
  threshold: number | null;
  evaluatedAt: string;
}

function compare(operator: string, value: number, threshold: number): boolean {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
    case "always":
      return value > 0;
    default:
      return false;
  }
}

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

export async function getBusinessRules(slug: string): Promise<BusinessRuleDto[]> {
  const workspaceId = await getWorkspaceId(slug);
  if (!workspaceId) return [];

  const rules = await prisma.businessRule.findMany({
    where: { workspaceId },
    orderBy: { category: "asc" }
  });

  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    category: rule.category,
    metric: rule.metric,
    operator: rule.operator,
    threshold: rule.threshold,
    severity: rule.severity,
    enabled: rule.enabled,
    description: rule.description
  }));
}

export async function evaluateBusinessRules(slug: string): Promise<RuleEvaluationResult[]> {
  const [rules, snapshot] = await Promise.all([getBusinessRules(slug), fetchOperationalSnapshot(slug)]);

  return rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const currentValue = snapshot.metrics[rule.metric] ?? null;
      let triggered = false;

      if (rule.operator === "always") {
        triggered = true;
      } else if (currentValue !== null && rule.threshold !== null) {
        triggered = compare(rule.operator, currentValue, rule.threshold);
      }

      const message = triggered
        ? `${rule.name}: ${rule.metric} = ${currentValue ?? "N/A"}${rule.threshold !== null ? ` (rule: ${rule.operator} ${rule.threshold})` : ""}`
        : `${rule.name}: within limits`;

      return { rule, triggered, currentValue, message };
    });
}

export async function getCriticalAlerts(slug: string): Promise<CriticalAlertDto[]> {
  const evaluations = await evaluateBusinessRules(slug);
  const evaluatedAt = new Date().toISOString();

  return evaluations
    .filter((e) => e.triggered && (e.rule.severity === "critical" || e.rule.severity === "high"))
    .map((e) => ({
      id: `alert-${e.rule.id}`,
      ruleId: e.rule.id,
      ruleName: e.rule.name,
      category: e.rule.category,
      severity: e.rule.severity,
      message: e.message,
      metric: e.rule.metric,
      currentValue: e.currentValue,
      threshold: e.rule.threshold,
      evaluatedAt
    }));
}
