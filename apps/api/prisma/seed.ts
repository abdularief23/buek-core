import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WORKSPACES = [
  {
    slug: "epson-factory",
    company: "Epson Demo",
    industry: "Electronics Manufacturing",
    organization: "Epson Indonesia",
    plant: "Karawang Plant",
    name: "Epson Factory"
  },
  {
    slug: "toyota-plant",
    company: "Toyota Demo",
    industry: "Automotive Assembly",
    organization: "Toyota Indonesia",
    plant: "Karawang Assembly",
    name: "Toyota Plant"
  },
  {
    slug: "nestle-factory",
    company: "Nestle Demo",
    industry: "Food & Beverage",
    organization: "Nestlé Indonesia",
    plant: "Cikupa Plant",
    name: "Nestlé Factory"
  },
  {
    slug: "custom-company",
    company: "Custom Company",
    industry: "General Manufacturing",
    organization: "Custom Workspace",
    plant: "Main Plant",
    name: "Custom Workspace"
  }
] as const;

const INVESTIGATION_STEPS = [
  { key: "evidence", label: "Evidence", done: false },
  { key: "root_cause", label: "Root Cause", done: false },
  { key: "countermeasure", label: "Countermeasure", done: false },
  { key: "approval", label: "Approval", done: false },
  { key: "closed", label: "Closed", done: false }
];

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedWorkspace(config: (typeof WORKSPACES)[number]) {
  const company = await prisma.company.upsert({
    where: { id: `company-${config.slug}` },
    update: { name: config.company, industry: config.industry },
    create: {
      id: `company-${config.slug}`,
      name: config.company,
      industry: config.industry
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: config.slug },
    update: {
      name: config.name,
      organization: config.organization,
      plant: config.plant,
      industry: config.industry
    },
    create: {
      id: `ws-${config.slug}`,
      companyId: company.id,
      slug: config.slug,
      name: config.name,
      organization: config.organization,
      plant: config.plant,
      industry: config.industry,
      domain: "manufacturing"
    }
  });

  const plant = await prisma.plant.upsert({
    where: { id: `plant-${config.slug}` },
    update: { name: config.plant },
    create: {
      id: `plant-${config.slug}`,
      workspaceId: workspace.id,
      name: config.plant
    }
  });

  const employees = await Promise.all(
    [
      { name: "Budi", email: "budi@demo.local", role: "Operator" },
      { name: "Abdul", email: "abdul@demo.local", role: "Engineer" },
      { name: "Sari", email: "sari@demo.local", role: "Supervisor" },
      { name: "Raka", email: "raka@demo.local", role: "Plant Manager" }
    ].map((emp) =>
      prisma.employee.upsert({
        where: { id: `emp-${config.slug}-${emp.role.toLowerCase().replace(/\s+/g, "-")}` },
        update: { name: emp.name, role: emp.role },
        create: {
          id: `emp-${config.slug}-${emp.role.toLowerCase().replace(/\s+/g, "-")}`,
          companyId: company.id,
          workspaceId: workspace.id,
          name: emp.name,
          email: emp.email,
          role: emp.role
        }
      })
    )
  );

  const engineer = employees.find((e) => e.role === "Engineer")!;
  const supervisor = employees.find((e) => e.role === "Supervisor")!;

  const lineCount = config.slug === "epson-factory" ? 6 : 4;
  const machinesPerLine = config.slug === "epson-factory" ? 12 : 10;
  const machineCodes: string[] = [];

  for (let lineIdx = 1; lineIdx <= lineCount; lineIdx++) {
    const line = await prisma.productionLine.upsert({
      where: { id: `line-${config.slug}-${lineIdx}` },
      update: { name: `Line ${lineIdx}` },
      create: {
        id: `line-${config.slug}-${lineIdx}`,
        plantId: plant.id,
        name: config.slug === "toyota-plant" && lineIdx === 1 ? "EA Line" : `Line ${lineIdx}`
      }
    });

    for (let m = 1; m <= machinesPerLine; m++) {
      const code =
        config.slug === "toyota-plant" && lineIdx === 1
          ? `EA-${String(m).padStart(2, "0")}`
          : `M-${lineIdx}${String(m).padStart(2, "0")}`;
      machineCodes.push(code);

      const machine = await prisma.machine.upsert({
        where: { id: `machine-${config.slug}-${code}` },
        update: {},
        create: {
          id: `machine-${config.slug}-${code}`,
          lineId: line.id,
          code,
          name: `Machine ${code}`,
          status: code.endsWith("12") || code === "EA-04" ? "alarm" : m % 7 === 0 ? "maintenance" : "running"
        }
      });

      for (let h = 4; h >= 0; h--) {
        const baseTemp = code.endsWith("12") || code === "EA-04" ? 72 : 68;
        const baseVib = code.endsWith("12") || code === "EA-04" ? 3.2 : 1.8;
        const recordedAt = hoursAgo(h * 0.5);
        await prisma.machineTelemetry.createMany({
          data: [
            {
              machineId: machine.id,
              metric: "temperature",
              value: baseTemp + h * 2 + (m % 3),
              recordedAt
            },
            {
              machineId: machine.id,
              metric: "vibration",
              value: Number((baseVib + h * 0.15).toFixed(2)),
              recordedAt
            }
          ],
          skipDuplicates: true
        });
      }
    }
  }

  const sopCategories = ["Quality", "Maintenance", "Safety", "Assembly", "Packaging"];
  for (let i = 1; i <= 120; i++) {
    const ref = `SOP-${String(i).padStart(3, "0")}`;
    await prisma.sopDocument.upsert({
      where: { workspaceId_referenceId: { workspaceId: workspace.id, referenceId: ref } },
      update: {},
      create: {
        workspaceId: workspace.id,
        referenceId: ref,
        title: `${sopCategories[i % sopCategories.length]} Procedure ${i}`,
        revision: `Rev.${(i % 5) + 1}`,
        category: sopCategories[i % sopCategories.length]!
      }
    });
  }

  const flagshipMachineCode =
    config.slug === "toyota-plant" ? "EA-04" : config.slug === "epson-factory" ? "M-312" : "M-310";
  const flagshipMachine = await prisma.machine.findFirst({
    where: { id: `machine-${config.slug}-${flagshipMachineCode}` }
  });
  const flagshipMachineId = flagshipMachine?.id ?? `machine-${config.slug}-${machineCodes[0] ?? "M-101"}`;

  const whiteStreakIssue = await prisma.issue.upsert({
    where: { id: `issue-${config.slug}-white-streak` },
    update: { progress: 65, status: "investigating" },
    create: {
      id: `issue-${config.slug}-white-streak`,
      workspaceId: workspace.id,
      machineId: flagshipMachineId,
      title: "White Streak Defect",
      description: "White streak defect rate increased 18% compared to yesterday.",
      status: "investigating",
      severity: "high",
      progress: 65,
      ownerId: engineer.id,
      dueAt: todayAt(17, 0)
    }
  });

  await prisma.investigation.upsert({
    where: { issueId: whiteStreakIssue.id },
    update: {
      progress: 65,
      steps: [
        { key: "evidence", label: "Evidence", done: true },
        { key: "root_cause", label: "Root Cause", done: true },
        { key: "countermeasure", label: "Countermeasure", done: false },
        { key: "approval", label: "Approval", done: false },
        { key: "closed", label: "Closed", done: false }
      ]
    },
    create: {
      issueId: whiteStreakIssue.id,
      status: "in_progress",
      progress: 65,
      steps: [
        { key: "evidence", label: "Evidence", done: true },
        { key: "root_cause", label: "Root Cause", done: true },
        { key: "countermeasure", label: "Countermeasure", done: false },
        { key: "approval", label: "Approval", done: false },
        { key: "closed", label: "Closed", done: false }
      ]
    }
  });

  const vibrationIssue = await prisma.issue.upsert({
    where: { id: `issue-${config.slug}-vibration` },
    update: {},
    create: {
      id: `issue-${config.slug}-vibration`,
      workspaceId: workspace.id,
      machineId: flagshipMachineId,
      title: `${flagshipMachineCode} Vibration Alarm`,
      description: "Elevated vibration detected — likely bearing wear.",
      status: "open",
      severity: "critical",
      progress: 20,
      ownerId: engineer.id,
      dueAt: todayAt(15, 0)
    }
  });

  await prisma.investigation.upsert({
    where: { issueId: vibrationIssue.id },
    update: {},
    create: {
      issueId: vibrationIssue.id,
      status: "in_progress",
      progress: 20,
      steps: INVESTIGATION_STEPS.map((step, idx) => ({
        ...step,
        done: idx === 0
      }))
    }
  });

  for (let i = 1; i <= 28; i++) {
    const machineCode = machineCodes[i % machineCodes.length]!;
    const machineId = `machine-${config.slug}-${machineCode}`;
    const statuses = ["resolved", "closed", "investigating", "open"];
    await prisma.issue.upsert({
      where: { id: `issue-${config.slug}-hist-${i}` },
      update: {},
      create: {
        id: `issue-${config.slug}-hist-${i}`,
        workspaceId: workspace.id,
        machineId,
        title: `Historical Issue #${190 + i}`,
        status: statuses[i % statuses.length]!,
        severity: i % 4 === 0 ? "critical" : "medium",
        progress: (i * 7) % 100,
        ownerId: engineer.id,
        createdAt: hoursAgo(24 * (i % 14))
      }
    });
  }

  const pendingWorkOrders = [
    {
      id: `wo-${config.slug}-001`,
      number: "WO-240701",
      title: "Bearing Replacement",
      reason: "Bearing replacement for elevated vibration",
      risk: "medium",
      machineId: flagshipMachineId,
      issueId: vibrationIssue.id
    },
    {
      id: `wo-${config.slug}-002`,
      number: "WO-240702",
      title: "Nozzle Calibration",
      reason: "Recalibrate print head nozzle after white streak spike",
      risk: "low",
      machineId: flagshipMachineId,
      issueId: whiteStreakIssue.id
    },
    {
      id: `wo-${config.slug}-003`,
      number: "WO-240703",
      title: "Alignment Check",
      reason: "Alignment verification after repeated bearing failures",
      risk: "high",
      machineId: flagshipMachineId,
      issueId: vibrationIssue.id
    }
  ];

  for (const wo of pendingWorkOrders) {
    const workOrder = await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: { status: "pending_approval" },
      create: {
        id: wo.id,
        workspaceId: workspace.id,
        number: wo.number,
        machineId: wo.machineId,
        issueId: wo.issueId,
        title: wo.title,
        reason: wo.reason,
        risk: wo.risk,
        status: "pending_approval",
        engineerId: engineer.id,
        aiReview: {
          checks: [
            { label: "SOP followed", status: "pass", detail: "SOP-014 Rev.5 referenced" },
            { label: "Parts available", status: "pass", detail: "Bearing SKF in stock (4 units)" },
            {
              label: "Downtime estimate",
              status: "warning",
              detail: wo.risk === "high" ? "60 min" : wo.risk === "medium" ? "40 min" : "25 min"
            }
          ],
          summary: "Work order is ready for supervisor review."
        }
      }
    });

    await prisma.approval.upsert({
      where: { workOrderId: workOrder.id },
      update: { status: "waiting" },
      create: {
        workOrderId: workOrder.id,
        status: "waiting"
      }
    });
  }

  for (let i = 4; i <= 45; i++) {
    const machineCode = machineCodes[i % machineCodes.length]!;
    const statuses = ["completed", "in_progress", "approved", "rejected"];
    const status = statuses[i % statuses.length]!;
    const woId = `wo-${config.slug}-${String(i).padStart(3, "0")}`;
    const workOrder = await prisma.workOrder.upsert({
      where: { id: woId },
      update: {},
      create: {
        id: woId,
        workspaceId: workspace.id,
        number: `WO-24${String(700 + i)}`,
        machineId: `machine-${config.slug}-${machineCode}`,
        title: `Maintenance Task ${i}`,
        reason: `Scheduled maintenance item ${i}`,
        risk: i % 3 === 0 ? "high" : "medium",
        status,
        engineerId: engineer.id,
        aiReview: {
          checks: [{ label: "SOP followed", status: "pass", detail: "Standard procedure" }],
          summary: "Historical work order"
        }
      }
    });

    if (status === "pending_approval") {
      await prisma.approval.upsert({
        where: { workOrderId: workOrder.id },
        update: {},
        create: { workOrderId: workOrder.id, status: "waiting" }
      });
    } else if (status === "approved" || status === "completed") {
      await prisma.approval.upsert({
        where: { workOrderId: workOrder.id },
        update: {},
        create: {
          workOrderId: workOrder.id,
          status: "approved",
          decidedById: supervisor.id,
          decidedAt: hoursAgo(i)
        }
      });
    }
  }

  const metrics = ["production", "quality", "delivery", "safety"];
  const baseValues: Record<string, number> = {
    production: 95,
    quality: 97,
    delivery: 98,
    safety: 100
  };

  for (let hour = 6; hour <= 11; hour++) {
    for (const metric of metrics) {
      await prisma.kpiSnapshot.create({
        data: {
          plantId: plant.id,
          metric,
          value: baseValues[metric]! + (hour - 8) * 0.4 + (metric === "production" ? 0.5 : 0),
          recordedAt: todayAt(hour, hour % 2 === 0 ? 0 : 30)
        }
      });
    }
  }

  const timelineEvents = [
    { at: todayAt(8, 0), title: "Production Start", category: "production" },
    { at: todayAt(9, 15), title: "Machine Alarm", detail: `${flagshipMachineCode} vibration threshold exceeded`, category: "maintenance" },
    { at: todayAt(9, 40), title: "Engineer Assigned", detail: `${engineer.name} assigned to ${flagshipMachineCode}`, category: "maintenance" },
    { at: todayAt(10, 5), title: "White Streak Spike", detail: "+18% vs yesterday", category: "quality" },
    { at: todayAt(10, 30), title: "Countermeasure Drafted", detail: "Nozzle recalibration proposed", category: "quality" },
    { at: todayAt(11, 0), title: "Line Running", detail: "Production resumed at reduced speed", category: "production" }
  ];

  await prisma.activityEvent.deleteMany({ where: { workspaceId: workspace.id } });
  for (const event of timelineEvents) {
    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        occurredAt: event.at,
        title: event.title,
        detail: event.detail,
        category: event.category
      }
    });
  }

  await prisma.graphEdge.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.graphEdge.createMany({
    data: [
      {
        workspaceId: workspace.id,
        fromType: "machine",
        fromId: flagshipMachineId,
        relation: "uses",
        toType: "part",
        toId: "bearing-skf-6205",
        label: "Bearing SKF 6205"
      },
      {
        workspaceId: workspace.id,
        fromType: "machine",
        fromId: flagshipMachineId,
        relation: "related_sop",
        toType: "sop",
        toId: "SOP-014",
        label: "SOP-014 Rev.5"
      },
      {
        workspaceId: workspace.id,
        fromType: "issue",
        fromId: whiteStreakIssue.id,
        relation: "similar_issue",
        toType: "issue",
        toId: `issue-${config.slug}-hist-12`,
        label: "Issue #202 — same defect pattern"
      },
      {
        workspaceId: workspace.id,
        fromType: "issue",
        fromId: vibrationIssue.id,
        relation: "owned_by",
        toType: "employee",
        toId: engineer.id,
        label: engineer.name
      }
    ]
  });

  await prisma.sopRevision.upsert({
    where: { id: `sop-rev-${config.slug}-014` },
    update: { status: "pending_approval" },
    create: {
      id: `sop-rev-${config.slug}-014`,
      workspaceId: workspace.id,
      referenceId: "SOP-014",
      title: "Nozzle Calibration Procedure",
      revision: "Rev.6",
      summary: "Updated torque values and calibration interval after white streak analysis.",
      status: "pending_approval",
      submitterId: engineer.id,
      aiReview: {
        checks: [
          { label: "Safety review", status: "pass", detail: "No new hazards identified" },
          { label: "Impact assessment", status: "pass", detail: "Affects Line 3 nozzle setup" },
          { label: "Training required", status: "warning", detail: "Operators need briefing" }
        ],
        summary: "SOP revision ready for supervisor approval."
      }
    }
  });

  await prisma.engineeringReport.upsert({
    where: { id: `report-${config.slug}-001` },
    update: {},
    create: {
      id: `report-${config.slug}-001`,
      workspaceId: workspace.id,
      issueId: whiteStreakIssue.id,
      title: "White Streak Root Cause Analysis",
      content:
        "Preliminary analysis indicates nozzle pressure drift during shift changeover. Recommend recalibration per SOP-014.",
      status: "pending_approval",
      authorId: engineer.id
    }
  });

  await prisma.engineeringReport.upsert({
    where: { id: `report-${config.slug}-002` },
    update: {},
    create: {
      id: `report-${config.slug}-002`,
      workspaceId: workspace.id,
      issueId: vibrationIssue.id,
      title: "M-12 Vibration Investigation Draft",
      content: "Bearing wear suspected. Historical data shows similar pattern 3 weeks ago — alignment may be root cause.",
      status: "pending_approval",
      authorId: engineer.id
    }
  });

  const lineName = config.slug === "toyota-plant" ? "EA Line" : "Line 3";
  await prisma.operatorChecklistRun.upsert({
    where: { id: `checklist-${config.slug}-today` },
    update: {},
    create: {
      id: `checklist-${config.slug}-today`,
      workspaceId: workspace.id,
      line: lineName,
      shift: "Shift A",
      targetOutput: 420,
      progress: 165,
      items: [
        { id: "c1", label: "First Article Inspection", done: true },
        { id: "c2", label: "Torque Check", done: false },
        { id: "c3", label: "Material Verification", done: false },
        { id: "c4", label: "Final Cleaning", done: false }
      ]
    }
  });

  await prisma.memoryRecord.deleteMany({
    where: { workspaceId: workspace.id, scope: { startsWith: "machine:" } }
  });
  await prisma.memoryRecord.createMany({
    data: [
      {
        workspaceId: workspace.id,
        scope: `machine:${flagshipMachineCode}`,
        content:
          "Bearing was replaced 3 weeks ago on this machine. If vibration returns, check alignment before replacing bearing again.",
        tags: ["bearing", "history", "root_cause"]
      },
      {
        workspaceId: workspace.id,
        scope: `issue:white-streak`,
        content: "Similar white streak defect occurred in Issue #202 — resolved by nozzle recalibration.",
        tags: ["quality", "similar_case"]
      }
    ]
  });

  console.log(`Seeded ${config.slug}: ${machineCodes.length} machines, 120 SOPs, issues & work orders`);
}

async function main() {
  const existing = await prisma.workspace.count();
  if (existing > 0) {
    console.log("Database already seeded — refreshing timeline & KPI snapshots only.");
  }

  for (const ws of WORKSPACES) {
    await seedWorkspace(ws);
  }

  console.log("Enterprise graph seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
