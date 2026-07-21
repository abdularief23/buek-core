/** Parse operator production / NG data stored in issue description. */

export interface ProductionContext {
  totalProduction: number;
  rejectCount: number;
  ppm: number;
  ngRatePercent: number;
  ngPhenomenon?: string;
  shift?: string;
  reporterName?: string;
}

export function parseProductionContext(description: string | null | undefined): ProductionContext | null {
  if (!description) return null;

  const totalMatch = description.match(/Total Production:\s*([\d,]+)\s*pcs/i);
  const rejectMatch = description.match(/Reject Count(?:\s*\(NG\))?:\s*([\d,]+)\s*pcs/i);
  if (!totalMatch || !rejectMatch) return null;

  const totalProduction = Number(totalMatch[1]!.replace(/,/g, ""));
  const rejectCount = Number(rejectMatch[1]!.replace(/,/g, ""));
  if (!totalProduction || totalProduction <= 0 || rejectCount < 0) return null;

  const ppm = Math.round((rejectCount / totalProduction) * 1_000_000);
  const ngRatePercent = Number(((rejectCount / totalProduction) * 100).toFixed(2));
  const shiftMatch = description.match(/Shift:\s*(.+)/i);
  const reporterMatch = description.match(/Operator Report by\s+(.+)/i);
  const phenomenonMatch = description.match(/NG Phenomenon:\s*(.+)/i);

  return {
    totalProduction,
    rejectCount,
    ppm,
    ngRatePercent,
    ...(phenomenonMatch?.[1] ? { ngPhenomenon: phenomenonMatch[1].trim() } : {}),
    ...(shiftMatch?.[1] ? { shift: shiftMatch[1].trim() } : {}),
    ...(reporterMatch?.[1] ? { reporterName: reporterMatch[1].trim() } : {})
  };
}

export function calculatePpmMetrics(
  production: ProductionContext | null,
  fallback: { current: number; target: number; increase: number }
) {
  if (!production) {
    return {
      currentPpm: fallback.current,
      targetPpm: fallback.target,
      increasePercent: fallback.increase,
      source: "estimate" as const,
      production: null
    };
  }

  const targetPpm = fallback.target;
  const increasePercent =
    targetPpm > 0
      ? Math.max(0, Math.round(((production.ppm - targetPpm) / targetPpm) * 100))
      : fallback.increase;

  return {
    currentPpm: production.ppm,
    targetPpm,
    increasePercent,
    source: "operator_report" as const,
    production
  };
}
