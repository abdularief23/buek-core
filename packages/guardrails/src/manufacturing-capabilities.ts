/** Manufacturing module knowledge capabilities — guardrails allow by domain, not narrow keywords. */
export const MANUFACTURING_KNOWLEDGE_CAPABILITIES = [
  "sop",
  "wi",
  "work instruction",
  "qc",
  "quality",
  "kpi",
  "ppm",
  "oee",
  "downtime",
  "maintenance",
  "customer complaint",
  "complaint",
  "capa",
  "ncr",
  "engineering report",
  "investigation report",
  "technical report",
  "work order",
  "production plan",
  "threshold",
  "critical",
  "defect",
  "root cause",
  "countermeasure",
  "verification",
  "lessons learned",
  "machine",
  "line",
  "shift",
  "reject",
  "scrap",
  "yield",
  "torque",
  "welding",
  "haccp",
  "ccp",
  "metal detector",
  "packaging",
  "print head",
  "ink",
  "bearing",
  "vibration",
  "telemetry",
  "sop revision",
  "approval",
  "supervisor",
  "operator",
  "engineer",
  "production",
  "assembly",
  "calibration",
  "inspection",
  "audit",
  "safety",
  "delivery",
  "throughput",
  "availability",
  "performance",
  "fpy",
  "mtbf",
  "mttr"
] as const;

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(rendang|nasi goreng|resep masak|memasak)\b/i,
  /\b(crypto|bitcoin|stock market|forex)\b/i,
  /\b(write (me )?a poem|love letter)\b/i
];

export function matchesManufacturingCapability(text: string): boolean {
  const normalized = text.toLowerCase();
  return MANUFACTURING_KNOWLEDGE_CAPABILITIES.some(
    (cap) => normalized.includes(cap) || cap.split(" ").every((word) => normalized.includes(word))
  );
}

export function isClearlyOffTopic(text: string): boolean {
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}
