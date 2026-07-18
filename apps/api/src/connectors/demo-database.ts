import { prisma } from "../db.js";
import type { OperationalConnector, OperationalSnapshot } from "./types.js";

async function getWorkspaceId(slug: string) {
  return (await prisma.workspace.findUnique({ where: { slug } }))?.id;
}

export const demoDatabaseConnector: OperationalConnector = {
  info: {
    id: "demo-database",
    type: "demo-database",
    label: "Demo Database (Simulated MES)",
    description:
      "Read-only connector for hackathon demo. Production uses MES/ERP/CMMS connectors — Buek never replaces your systems.",
    status: "demo",
    readOnly: true,
    lastSync: new Date().toISOString()
  },

  async fetchSnapshot(workspaceSlug: string): Promise<OperationalSnapshot> {
    const workspaceId = await getWorkspaceId(workspaceSlug);
    if (!workspaceId) {
      return {
        source: "demo-database",
        readOnly: true,
        fetchedAt: new Date().toISOString(),
        metrics: {},
        machines: [],
        alarms: []
      };
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        plants: {
          include: {
            lines: { include: { machines: true } },
            kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 40 }
          }
        },
        issues: { where: { status: { notIn: ["closed", "resolved"] } } }
      }
    });

    const machines =
      workspace?.plants.flatMap((plant) =>
        plant.lines.flatMap((line) =>
          line.machines.map((machine) => ({
            code: machine.code,
            name: machine.name,
            status: machine.status,
            downtimeMinutes: machine.status === "alarm" ? 45 : machine.status === "maintenance" ? 20 : 0
          }))
        )
      ) ?? [];

    const latestKpi: Record<string, number> = {};
    for (const plant of workspace?.plants ?? []) {
      for (const snap of plant.kpiSnapshots) {
        if (!(snap.metric in latestKpi)) {
          latestKpi[snap.metric] = snap.value;
        }
      }
    }

    const machinesDown = machines.filter((m) => m.status === "alarm" || m.status === "maintenance").length;
    const downtimeMinutes = machines.reduce((sum, m) => sum + (m.downtimeMinutes ?? 0), 0);
    const customerComplaints = workspace?.issues.filter((i) => i.severity === "critical").length ?? 0;
    const safetyIncidents = workspace?.issues.filter((i) => i.title.toLowerCase().includes("safety")).length ?? 0;

    const ppmBySlug: Record<string, number> = {
      "epson-factory": 3200,
      "toyota-plant": 1420,
      "nestle-factory": 890,
      "custom-company": 0
    };

    const metrics: Record<string, number> = {
      production: latestKpi.production ?? 96,
      quality: latestKpi.quality ?? 98,
      delivery: latestKpi.delivery ?? 99,
      safety: latestKpi.safety ?? 100,
      ppm: ppmBySlug[workspaceSlug] ?? 1500,
      downtime_minutes: downtimeMinutes,
      machines_down: machinesDown,
      customer_complaints: customerComplaints,
      safety_incidents: safetyIncidents,
      open_issues: workspace?.issues.length ?? 0
    };

    const alarms: OperationalSnapshot["alarms"] = (workspace?.issues ?? []).map((issue) => {
      const alarm: OperationalSnapshot["alarms"][number] = {
        id: issue.id,
        message: issue.title,
        severity: issue.severity
      };
      const machine = machines.find((m) => m.code);
      if (machine?.code) alarm.machineCode = machine.code;
      return alarm;
    });

    return {
      source: "demo-database",
      readOnly: true,
      fetchedAt: new Date().toISOString(),
      metrics,
      machines,
      alarms
    };
  }
};
