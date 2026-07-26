import { usagePercent } from "./plans.js";

export type UsageLevel = "ok" | "warning" | "blocked";

export const USAGE_WARNING_THRESHOLD = 80;

export interface UsageCheckResult {
  allowed: boolean;
  level: UsageLevel;
  used: number;
  limit: number | null;
  percent: number | null;
  reason?: string;
}

export function resolveUsageLevel(used: number, limit: number | null): UsageLevel {
  if (limit === null) return "ok";
  const percent = usagePercent(used, limit);
  if (percent !== null && percent >= 100) return "blocked";
  if (percent !== null && percent >= USAGE_WARNING_THRESHOLD) return "warning";
  return "ok";
}

export function buildUsageCheckResult(
  used: number,
  limit: number | null,
  metricLabel: string
): UsageCheckResult {
  const level = resolveUsageLevel(used, limit);
  const percent = usagePercent(used, limit);

  if (level === "blocked") {
    return {
      allowed: false,
      level,
      used,
      limit,
      percent,
      reason: `Batas bulanan ${metricLabel} tercapai (${used}/${limit}). Upgrade ke Pro untuk akses tanpa batas.`
    };
  }

  return {
    allowed: true,
    level,
    used,
    limit,
    percent,
    ...(level === "warning"
      ? {
          reason: `Peringatan: ${metricLabel} sudah ${percent}% dari kuota bulanan (${used}/${limit}).`
        }
      : {})
  };
}
