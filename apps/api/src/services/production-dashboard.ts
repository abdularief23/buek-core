import { getTenantThemeOrDefault } from "../tenants/index.js";
import { getIssues, getLiveKpis } from "./data-engine.js";

export interface ShiftStatus {
  name: string;
  status: "done" | "running" | "waiting";
}

export interface ProductionDashboardDto {
  target: number;
  current: number;
  achievement: number;
  unit: string;
  shifts: ShiftStatus[];
  issues: { total: number; critical: number };
  risks: string[];
}

export interface KpiDetailDto {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  target: string;
  trend: "up" | "down" | "flat";
  series: Array<{ time: string; value: number }>;
  highlights: string[];
}

function trendFromSeries(series: Array<{ value: number }>): "up" | "down" | "flat" {
  if (series.length < 2) return "flat";
  const first = series[0]!.value;
  const last = series[series.length - 1]!.value;
  if (last > first + 0.3) return "up";
  if (last < first - 0.3) return "down";
  return "flat";
}

function tenantKpiHighlights(slug: string, label: string): string[] {
  const tenant = getTenantThemeOrDefault(slug);

  if (label === "Production") {
    if (slug === "toyota-plant") {
      return [`Output ${tenant.lineLabel} berjalan`, "Chassis assembly on schedule"];
    }
    if (slug === "nestle-factory") {
      return [`Batch output ${tenant.lineLabel}`, "Filling line operating normal"];
    }
    return [`Output ${tenant.lineLabel} berjalan`, "Printer assembly on schedule"];
  }

  if (label === "Quality") {
    if (slug === "toyota-plant") {
      return ["Torque EA-04 drift detected", "Welding rework under review"];
    }
    if (slug === "nestle-factory") {
      return ["Metal detector alarm on P-03", "CCP verification pending"];
    }
    return ["White streak +18% vs kemarin", "Nozzle calibration perlu review"];
  }

  if (label === "Delivery") {
    if (slug === "toyota-plant") {
      return ["Engine shipment on-time 98%", "1 chassis unit pending QA"];
    }
    if (slug === "nestle-factory") {
      return ["Batch release on schedule", "1 pallet hold for QA"];
    }
    return ["On-time delivery 99%", "1 shipment pending approval"];
  }

  if (label === "Safety") {
    if (slug === "nestle-factory") {
      return ["HACCP compliance 100%", "GMP audit passed"];
    }
    return ["Zero incident hari ini", "PPE compliance 100%"];
  }

  return [`${tenant.industryLabel} metrics within range`];
}

export async function getProductionDashboard(slug: string): Promise<ProductionDashboardDto> {
  const tenant = getTenantThemeOrDefault(slug);
  const [kpis, issues] = await Promise.all([
    getLiveKpis(slug),
    getIssues(slug, ["open", "investigating"])
  ]);

  const production = kpis.find((k) => k.label === "Production");
  const achievement = production ? parseFloat(production.value) : 91.5;
  const target = tenant.productionTarget;
  const current = Math.round((achievement / 100) * target);
  const critical = issues.filter((i) => i.severity === "high" || i.severity === "critical").length;

  const risks: string[] = [];
  if (critical > 0) {
    const top = issues.find((i) => i.severity === "high" || i.severity === "critical");
    if (top?.machine) risks.push(`${top.machine.code} memerlukan perhatian`);
    else if (top) risks.push(`${top.title} — perlu tindakan`);
  }
  if (achievement < 95) risks.push("Target produksi berisiko tidak tercapai");

  return {
    target,
    current,
    achievement,
    unit: slug === "nestle-factory" ? "units" : "pcs",
    shifts: [
      { name: "Shift A", status: "done" },
      { name: "Shift B", status: "running" },
      { name: "Shift C", status: "waiting" }
    ],
    issues: { total: issues.length, critical },
    risks
  };
}

export async function getKpiDetail(slug: string, label: string): Promise<KpiDetailDto | null> {
  const kpis = await getLiveKpis(slug);
  const kpi = kpis.find((k) => k.label.toLowerCase() === label.toLowerCase());
  if (!kpi) return null;

  const trend = trendFromSeries(kpi.series);
  const highlights = tenantKpiHighlights(slug, kpi.label);

  return {
    label: kpi.label,
    value: kpi.value,
    status: kpi.status,
    target: kpi.label === "Safety" ? "100%" : "≥ 97%",
    trend,
    series: kpi.series,
    highlights
  };
}
